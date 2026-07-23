import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from '../expert-consultation/cloudinary.service';
import {
  AI_CHAT_CONTEXT_PAIR_LIMIT,
  AI_CHAT_DEFAULT_TOPIC,
  AI_CHAT_MAX_MESSAGE_LENGTH,
  AI_CHAT_MESSAGES_PAGE_SIZE,
} from './ai-care.constants';
import { CreateAiChatSessionDto } from './dto/create-ai-chat-session.dto';
import { ListAiChatMessagesQueryDto } from './dto/list-ai-chat-messages-query.dto';
import { GeminiChatService } from './gemini-chat.service';

@Injectable()
export class AiCareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiChatService: GeminiChatService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getOrCreateSession(userId: string) {
    const existing = await this.prisma.ai_chat_sessions.findFirst({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
    });

    if (existing) {
      return this.toSessionDto(existing);
    }

    const session = await this.prisma.ai_chat_sessions.create({
      data: {
        user_id: userId,
        topic: AI_CHAT_DEFAULT_TOPIC,
      },
    });

    return this.toSessionDto(session);
  }

  async listSessions(userId: string) {
    const session = await this.prisma.ai_chat_sessions.findFirst({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      include: {
        ai_chat_messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    if (!session) {
      return [];
    }

    return [
      {
        ...this.toSessionDto(session),
        preview: this.buildPreview(session.ai_chat_messages[0]?.content),
      },
    ];
  }

  async createSession(userId: string, dto: CreateAiChatSessionDto) {
    const existing = await this.prisma.ai_chat_sessions.findFirst({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
    });

    if (existing) {
      return this.toSessionDto(existing);
    }

    if (dto.plant_id) {
      const plant = await this.prisma.my_plants.findFirst({
        where: { id: dto.plant_id, user_id: userId },
        select: { id: true },
      });
      if (!plant) {
        throw new BadRequestException('Plant not found for this user');
      }
    }

    const session = await this.prisma.ai_chat_sessions.create({
      data: {
        user_id: userId,
        topic: dto.topic?.trim() || AI_CHAT_DEFAULT_TOPIC,
        related_plant_id: dto.plant_id ?? null,
      },
    });

    return this.toSessionDto(session);
  }

  async getMessages(
    userId: string,
    sessionId: string,
    query: ListAiChatMessagesQueryDto = {},
  ) {
    await this.assertSessionOwner(userId, sessionId);

    const limit = query.limit ?? AI_CHAT_MESSAGES_PAGE_SIZE;
    const beforeMessage = query.before
      ? await this.prisma.ai_chat_messages.findFirst({
          where: { id: query.before, session_id: sessionId },
        })
      : null;

    if (query.before && !beforeMessage) {
      throw new BadRequestException('Invalid pagination cursor');
    }

    const rows = await this.prisma.ai_chat_messages.findMany({
      where: {
        session_id: sessionId,
        ...(beforeMessage
          ? { created_at: { lt: beforeMessage.created_at ?? new Date() } }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse();

    return {
      messages: page.map((message) => this.toMessageDto(message)),
      has_more: hasMore,
      next_cursor: hasMore ? (page[0]?.id ?? null) : null,
    };
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
    imageBuffer?: Buffer,
  ) {
    const trimmed = content.trim();
    if (!trimmed && !imageBuffer) {
      throw new BadRequestException('Message content or image is required');
    }
    if (trimmed.length > AI_CHAT_MAX_MESSAGE_LENGTH) {
      throw new BadRequestException('Message is too long');
    }

    const session = await this.assertSessionOwner(userId, sessionId);

    let imageUrl: string | null = null;
    if (imageBuffer) {
      imageUrl = await this.cloudinaryService.uploadChatImage(
        imageBuffer,
        `ai-care/${userId}`,
      );
    }

    const userMessage = await this.prisma.ai_chat_messages.create({
      data: {
        session_id: sessionId,
        role: 'user',
        content: trimmed || null,
        image_url: imageUrl,
      },
    });

    const priorContext = await this.prisma.ai_chat_messages.findMany({
      where: {
        session_id: sessionId,
        role: { in: ['user', 'model'] },
        id: { not: userMessage.id },
      },
      orderBy: { created_at: 'desc' },
      take: AI_CHAT_CONTEXT_PAIR_LIMIT * 2,
    });

    const plantContext = session.related_plant_id
      ? await this.buildPlantContext(session.related_plant_id, userId)
      : undefined;

    const reply = await this.geminiChatService.generateReply({
      history: [
        ...priorContext.reverse().map((message) => ({
          role: message.role as 'user' | 'model',
          content: message.content ?? '',
          image_url: message.image_url,
        })),
        {
          role: 'user' as const,
          content: trimmed,
          image_url: imageUrl,
        },
      ],
      plantContext,
    });

    const modelMessage = await this.prisma.ai_chat_messages.create({
      data: {
        session_id: sessionId,
        role: 'model',
        content: reply,
      },
    });

    await this.prisma.ai_chat_sessions.update({
      where: { id: sessionId },
      data: { updated_at: new Date() },
    });

    return {
      sessionId,
      reply,
      userMessageId: userMessage.id,
      modelMessageId: modelMessage.id,
      userMessage: this.toMessageDto(userMessage),
      modelMessage: this.toMessageDto(modelMessage),
    };
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.assertSessionOwner(userId, sessionId);
    await this.prisma.ai_chat_messages.deleteMany({
      where: { session_id: sessionId },
    });
    return { id: sessionId };
  }

  private async assertSessionOwner(userId: string, sessionId: string) {
    const session = await this.prisma.ai_chat_sessions.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    if (session.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }
    return session;
  }

  private async buildPlantContext(plantId: string, userId: string) {
    const plant = await this.prisma.my_plants.findFirst({
      where: { id: plantId, user_id: userId },
      select: {
        nickname: true,
        species_name: true,
        location_city: true,
        ai_space_analysis: true,
      },
    });
    if (!plant) return undefined;

    const lines = [
      plant.nickname ? `Nickname: ${plant.nickname}` : '',
      plant.species_name ? `Species: ${plant.species_name}` : '',
      plant.location_city ? `City: ${plant.location_city}` : '',
      plant.ai_space_analysis
        ? `Space analysis: ${JSON.stringify(plant.ai_space_analysis)}`
        : '',
    ].filter(Boolean);

    return lines.join('\n');
  }

  private buildPreview(content?: string | null) {
    if (!content?.trim()) return 'No messages yet';
    return content.trim().slice(0, 96);
  }

  private toSessionDto(session: {
    id: string;
    topic: string | null;
    user_id: string;
    created_at: Date | null;
    updated_at: Date | null;
  }) {
    return {
      id: session.id,
      topic: session.topic ?? AI_CHAT_DEFAULT_TOPIC,
      user_id: session.user_id,
      created_at: session.created_at?.toISOString() ?? new Date().toISOString(),
      updated_at: session.updated_at?.toISOString() ?? new Date().toISOString(),
    };
  }

  private toMessageDto(message: {
    id: string;
    session_id: string;
    role: string;
    content: string | null;
    image_url: string | null;
    created_at: Date | null;
  }) {
    return {
      id: message.id,
      session_id: message.session_id,
      role: message.role,
      content: message.content ?? '',
      image_url: message.image_url,
      created_at: message.created_at?.toISOString() ?? new Date().toISOString(),
    };
  }
}
