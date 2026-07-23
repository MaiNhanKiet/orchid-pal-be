import { EXPERT_ROLE_NAMES } from '@app/common';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CHAT_ACTIVE_STATUSES,
  CHAT_CLOSED_STATUS,
  CHAT_MAX_IMAGE_URL_LENGTH,
  CHAT_MAX_IMAGE_URLS,
  CHAT_MAX_MESSAGE_LENGTH,
  CHAT_PENDING_STATUS,
  ARCHIVE_RETENTION_DAYS,
} from './chat.constants';
import { CreateConversationDto, SendMessageDto, UpdateExpertProfileDto, UpdateMessageDto } from './dto';
import { CloudinaryService } from './cloudinary.service';
import {
  ConsultationRealtimeService,
  NotificationService,
} from './notification.service';

type ConversationFilter = 'all' | 'pending' | 'active' | 'archived';

export function getArchiveDaysRemaining(archivedAt: Date | string | null | undefined) {
  if (!archivedAt) return null;
  const archived = archivedAt instanceof Date ? archivedAt : new Date(archivedAt);
  if (Number.isNaN(archived.getTime())) return null;

  const deleteAt = archived.getTime() + ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((deleteAt - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, daysLeft);
}

@Injectable()
export class ExpertConsultationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly realtime: ConsultationRealtimeService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private readonly messageInclude = {
    users: {
      select: { id: true, full_name: true, avatar_url: true },
    },
  } as const;

  private readonly expertListingSelect = {
    id: true,
    full_name: true,
    avatar_url: true,
    email: true,
    expert_profile: {
      select: {
        specialty: true,
        bio: true,
        location: true,
        tags: true,
        experience_years: true,
        is_available: true,
      },
    },
  } as const;

  private parseExpertTags(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  private mapExpertListing(
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string;
      expert_profile: {
        specialty: string | null;
        bio: string | null;
        location: string | null;
        tags: unknown;
        experience_years: number | null;
        is_available: boolean | null;
      } | null;
    },
  ) {
    const profile = user.expert_profile;

    return {
      id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      email: user.email,
      specialty: profile?.specialty ?? null,
      bio: profile?.bio ?? null,
      location: profile?.location ?? null,
      tags: this.parseExpertTags(profile?.tags),
      experience_years: profile?.experience_years ?? null,
      available: profile?.is_available ?? true,
    };
  }

  private mapExpertAccountProfile(
    user: {
      id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      created_at: Date | null;
      expert_profile: {
        specialty: string | null;
        bio: string | null;
        location: string | null;
        tags: unknown;
        experience_years: number | null;
        is_available: boolean | null;
      } | null;
    },
  ) {
    const profile = user.expert_profile;

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      specialty: profile?.specialty ?? null,
      bio: profile?.bio ?? null,
      location: profile?.location ?? null,
      tags: this.parseExpertTags(profile?.tags),
      experience_years: profile?.experience_years ?? null,
      is_available: profile?.is_available ?? true,
    };
  }

  async listExperts() {
    const experts = await this.prisma.users.findMany({
      where: {
        is_active: true,
        user_roles: {
          some: {
            roles: { name: { in: [...EXPERT_ROLE_NAMES] } },
          },
        },
      },
      select: this.expertListingSelect,
      orderBy: { full_name: 'asc' },
    });

    return experts.map((expert) => this.mapExpertListing(expert));
  }

  async getExpertById(expertId: string) {
    const expert = await this.prisma.users.findFirst({
      where: {
        id: expertId,
        is_active: true,
        user_roles: {
          some: {
            roles: { name: { in: [...EXPERT_ROLE_NAMES] } },
          },
        },
      },
      select: this.expertListingSelect,
    });

    if (!expert) {
      throw new NotFoundException('Expert not found');
    }

    return this.mapExpertListing(expert);
  }

  async getMyExpertProfile(userId: string) {
    if (!(await this.isOrchidExpert(userId))) {
      throw new ForbiddenException('Only experts can access this profile');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        created_at: true,
        expert_profile: {
          select: {
            specialty: true,
            bio: true,
            location: true,
            tags: true,
            experience_years: true,
            is_available: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapExpertAccountProfile(user);
  }

  async updateMyExpertProfile(userId: string, dto: UpdateExpertProfileDto) {
    if (!(await this.isOrchidExpert(userId))) {
      throw new ForbiddenException('Only experts can update this profile');
    }

    const userUpdate: {
      full_name?: string | null;
      phone?: string | null;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    if (dto.full_name !== undefined) {
      userUpdate.full_name = dto.full_name.trim() || null;
    }

    if (dto.phone !== undefined) {
      userUpdate.phone = dto.phone.trim() || null;
    }

    const profileUpdate = {
      specialty:
        dto.specialty !== undefined ? dto.specialty.trim() || null : undefined,
      bio: dto.bio !== undefined ? dto.bio.trim() || null : undefined,
      location:
        dto.location !== undefined ? dto.location.trim() || null : undefined,
      tags: dto.tags !== undefined ? dto.tags.map((tag) => tag.trim()).filter(Boolean) : undefined,
      experience_years:
        dto.experience_years !== undefined ? dto.experience_years : undefined,
      is_available:
        dto.is_available !== undefined ? dto.is_available : undefined,
      updated_at: new Date(),
    };

    const hasProfileFields = Object.entries(profileUpdate).some(
      ([key, value]) => key !== 'updated_at' && value !== undefined,
    );

    await this.prisma.$transaction(async (tx) => {
      if (dto.full_name !== undefined || dto.phone !== undefined) {
        await tx.users.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      if (hasProfileFields) {
        const createData = {
          user_id: userId,
          specialty: profileUpdate.specialty ?? null,
          bio: profileUpdate.bio ?? null,
          location: profileUpdate.location ?? null,
          tags: profileUpdate.tags ?? [],
          experience_years: profileUpdate.experience_years ?? null,
          is_available: profileUpdate.is_available ?? true,
        };

        const updateData = Object.fromEntries(
          Object.entries(profileUpdate).filter(([, value]) => value !== undefined),
        );

        await tx.expert_profiles.upsert({
          where: { user_id: userId },
          create: createData,
          update: updateData,
        });
      }
    });

    return this.getMyExpertProfile(userId);
  }

  async isOrchidExpert(userId: string) {
    const expert = await this.prisma.users.findFirst({
      where: {
        id: userId,
        is_active: true,
        user_roles: {
          some: {
            roles: { name: { in: [...EXPERT_ROLE_NAMES] } },
          },
        },
      },
      select: { id: true },
    });

    return Boolean(expert);
  }

  async listConversationsForUser(userId: string, filter: ConversationFilter = 'all') {
    const isExpert = await this.isOrchidExpert(userId);

    const archiveFilter =
      filter === 'archived'
        ? { archived_at: { not: null } }
        : { archived_at: null };

    const statusFilter =
      filter === 'pending'
        ? { status: CHAT_PENDING_STATUS }
        : filter === 'active'
          ? { status: { in: [...CHAT_ACTIVE_STATUSES] } }
          : filter === 'archived'
            ? {}
            : {};

    return this.prisma.expert_conversations.findMany({
      where: {
        ...(isExpert ? { expert_id: userId } : { customer_id: userId }),
        ...archiveFilter,
        ...statusFilter,
      },
      orderBy:
        filter === 'archived' ? { archived_at: 'desc' } : { updated_at: 'desc' },
      include: this.conversationInclude(),
    });
  }

  async createConversation(customerId: string, dto: CreateConversationDto) {
    const expert = await this.prisma.users.findFirst({
      where: {
        id: dto.expert_id,
        is_active: true,
        user_roles: {
          some: {
            roles: { name: { in: [...EXPERT_ROLE_NAMES] } },
          },
        },
      },
    });

    if (!expert) {
      throw new NotFoundException('Expert not found');
    }

    if (dto.related_plant_id) {
      const plant = await this.prisma.my_plants.findFirst({
        where: { id: dto.related_plant_id, user_id: customerId },
      });
      if (!plant) {
        throw new NotFoundException('Plant not found');
      }
    }

    const existing = await this.prisma.expert_conversations.findFirst({
      where: {
        customer_id: customerId,
        expert_id: dto.expert_id,
        status: { not: CHAT_CLOSED_STATUS },
        archived_at: null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'You already have an active consultation with this expert',
      );
    }

    const conversation = await this.prisma.expert_conversations.create({
      data: {
        customer_id: customerId,
        expert_id: dto.expert_id,
        related_plant_id: dto.related_plant_id,
        topic: dto.topic,
        status: CHAT_PENDING_STATUS,
      },
      include: this.conversationInclude(),
    });

    const customerName = conversation.customer?.full_name ?? 'A customer';
    await this.notificationService.create({
      userId: conversation.expert_id!,
      type: 'CONSULTATION_REQUEST',
      title: 'New consultation request',
      body: `${customerName} requested a consultation`,
      data: { conversation_id: conversation.id },
    });

    this.realtime.broadcastConversation(conversation);
    return conversation;
  }

  async acceptConversation(conversationId: string, expertId: string) {
    const conversation = await this.getConversationForExpert(
      conversationId,
      expertId,
    );

    if (conversation.status !== CHAT_PENDING_STATUS) {
      throw new BadRequestException('Conversation is not pending');
    }

    const updated = await this.prisma.expert_conversations.update({
      where: { id: conversationId },
      data: { status: 'OPEN', updated_at: new Date() },
      include: this.conversationInclude(),
    });

    const expertName = updated.expert?.full_name ?? 'Expert';
    await this.notificationService.create({
      userId: updated.customer_id!,
      type: 'CONSULTATION_ACCEPTED',
      title: 'Consultation accepted',
      body: `${expertName} accepted your consultation request`,
      data: { conversation_id: updated.id },
    });

    this.realtime.broadcastConversation(updated);
    return updated;
  }

  async rejectConversation(conversationId: string, expertId: string) {
    const conversation = await this.getConversationForExpert(
      conversationId,
      expertId,
    );

    if (conversation.status !== CHAT_PENDING_STATUS) {
      throw new BadRequestException('Conversation is not pending');
    }

    const updated = await this.prisma.expert_conversations.update({
      where: { id: conversationId },
      data: { status: CHAT_CLOSED_STATUS, updated_at: new Date() },
      include: this.conversationInclude(),
    });

    const expertName = updated.expert?.full_name ?? 'Expert';
    await this.notificationService.create({
      userId: updated.customer_id!,
      type: 'CONSULTATION_REJECTED',
      title: 'Consultation declined',
      body: `${expertName} declined your consultation request`,
      data: { conversation_id: updated.id },
    });

    this.realtime.broadcastConversation(updated);
    return updated;
  }

  async closeConversation(conversationId: string, expertId: string) {
    const conversation = await this.getConversationForExpert(
      conversationId,
      expertId,
    );

    if (conversation.status === CHAT_CLOSED_STATUS) {
      throw new BadRequestException('Conversation is already closed');
    }

    const updated = await this.prisma.expert_conversations.update({
      where: { id: conversationId },
      data: { status: CHAT_CLOSED_STATUS, updated_at: new Date() },
      include: this.conversationInclude(),
    });

    const expertName = updated.expert?.full_name ?? 'Expert';
    await this.notificationService.create({
      userId: updated.customer_id!,
      type: 'CONSULTATION_CLOSED',
      title: 'Consultation ended',
      body: `${expertName} closed this consultation. You can book again anytime.`,
      data: { conversation_id: updated.id },
    });

    this.realtime.broadcastConversation(updated);
    return updated;
  }

  async getMessages(conversationId: string, userId: string, since?: string) {
    await this.assertConversationAccess(conversationId, userId);

    const sinceDate = since ? new Date(since) : null;
    if (since && Number.isNaN(sinceDate?.getTime())) {
      throw new BadRequestException('Invalid since timestamp');
    }

    return this.prisma.expert_messages.findMany({
      where: {
        conversation_id: conversationId,
        ...(sinceDate ? { created_at: { gt: sinceDate } } : {}),
      },
      orderBy: { created_at: 'asc' },
      include: {
        users: {
          select: { id: true, full_name: true, avatar_url: true },
        },
      },
    });
  }

  validateOutgoingMessage(dto: Pick<SendMessageDto, 'content' | 'image_urls'>) {
    const content = dto.content?.trim() ?? '';
    const imageUrls = dto.image_urls ?? [];

    if (!content && imageUrls.length === 0) {
      throw new BadRequestException('Message content or image is required');
    }

    if (content.length > CHAT_MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message exceeds ${CHAT_MAX_MESSAGE_LENGTH} characters`,
      );
    }

    if (imageUrls.length > CHAT_MAX_IMAGE_URLS) {
      throw new BadRequestException(
        `A message can include at most ${CHAT_MAX_IMAGE_URLS} images`,
      );
    }

    for (const url of imageUrls) {
      if (url.length > CHAT_MAX_IMAGE_URL_LENGTH) {
        throw new BadRequestException('Image URL is too long');
      }
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: Pick<SendMessageDto, 'content' | 'image_urls' | 'client_message_id'>,
  ) {
    const conversation = await this.assertConversationAccess(
      conversationId,
      senderId,
    );

    if (!CHAT_ACTIVE_STATUSES.includes(conversation.status as (typeof CHAT_ACTIVE_STATUSES)[number])) {
      throw new ForbiddenException('Conversation is not active');
    }

    if (conversation.archived_at) {
      throw new ForbiddenException('Conversation is archived');
    }

    this.validateOutgoingMessage(dto);

    if (dto.client_message_id) {
      const existing = await this.prisma.expert_messages.findFirst({
        where: {
          conversation_id: conversationId,
          client_message_id: dto.client_message_id,
        },
        include: {
          users: {
            select: { id: true, full_name: true, avatar_url: true },
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    const message = await this.prisma.expert_messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
        client_message_id: dto.client_message_id,
        content: dto.content?.trim() || null,
        image_urls: dto.image_urls ?? undefined,
      },
      include: {
        users: {
          select: { id: true, full_name: true, avatar_url: true },
        },
      },
    });

    await this.prisma.expert_conversations.update({
      where: { id: conversationId },
      data: {
        updated_at: new Date(),
        status:
          conversation.status === 'OPEN' ? 'IN_PROGRESS' : conversation.status,
      },
    });

    const recipientId =
      senderId === conversation.customer_id
        ? conversation.expert_id
        : conversation.customer_id;

    if (recipientId) {
      const senderName = message.users?.full_name ?? 'Someone';
      await this.notificationService.create({
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New message',
        body: `${senderName}: ${message.content?.slice(0, 80) ?? 'Sent an image'}`,
        data: {
          conversation_id: conversationId,
          message_id: message.id,
        },
      });
    }

    return message;
  }

  private assertMutableConversation(conversation: {
    status: string | null;
    archived_at: Date | null;
  }) {
    if (!CHAT_ACTIVE_STATUSES.includes(conversation.status as (typeof CHAT_ACTIVE_STATUSES)[number])) {
      throw new ForbiddenException('Conversation is not active');
    }

    if (conversation.archived_at) {
      throw new ForbiddenException('Conversation is archived');
    }
  }

  private parseImageUrls(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ) {
    const conversation = await this.assertConversationAccess(conversationId, userId);
    this.assertMutableConversation(conversation);

    const message = await this.prisma.expert_messages.findFirst({
      where: { id: messageId, conversation_id: conversationId },
      include: this.messageInclude,
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.is_deleted) {
      throw new BadRequestException('Deleted messages cannot be edited');
    }

    const imageUrls = this.parseImageUrls(message.image_urls);
    const trimmed = dto.content.trim();

    if (!trimmed && imageUrls.length === 0) {
      throw new BadRequestException('Message content or image is required');
    }

    if (trimmed.length > CHAT_MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message exceeds ${CHAT_MAX_MESSAGE_LENGTH} characters`,
      );
    }

    if (trimmed === (message.content?.trim() ?? '')) {
      throw new BadRequestException('Message is unchanged');
    }

    const updated = await this.prisma.expert_messages.update({
      where: { id: messageId },
      data: {
        content: trimmed || null,
        edited_at: new Date(),
        updated_at: new Date(),
      },
      include: this.messageInclude,
    });

    this.realtime.emitToConversation(conversationId, 'message_edited', updated);
    return updated;
  }

  async deleteMessage(conversationId: string, messageId: string, userId: string) {
    const conversation = await this.assertConversationAccess(conversationId, userId);
    this.assertMutableConversation(conversation);

    const message = await this.prisma.expert_messages.findFirst({
      where: { id: messageId, conversation_id: conversationId },
      include: this.messageInclude,
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.is_deleted) {
      return message;
    }

    const imageUrls = this.parseImageUrls(message.image_urls);
    for (const url of imageUrls) {
      try {
        await this.cloudinaryService.deleteChatImage(url, userId);
      } catch {
        // Best-effort cleanup; message deletion still proceeds.
      }
    }

    const deleted = await this.prisma.expert_messages.update({
      where: { id: messageId },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        updated_at: new Date(),
        content: null,
        image_urls: null,
      },
      include: this.messageInclude,
    });

    this.realtime.emitToConversation(conversationId, 'message_deleted', deleted);
    return deleted;
  }

  async assertConversationAccess(conversationId: string, userId: string) {
    const conversation = await this.prisma.expert_conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.customer_id !== userId &&
      conversation.expert_id !== userId
    ) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  async getConversationParticipants(conversationId: string) {
    const conversation = await this.prisma.expert_conversations.findUnique({
      where: { id: conversationId },
      select: { customer_id: true, expert_id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async listConversationPresenceTargets(userId: string) {
    return this.prisma.expert_conversations.findMany({
      where: {
        OR: [{ customer_id: userId }, { expert_id: userId }],
        archived_at: null,
      },
      select: { id: true },
    });
  }

  async archiveConversation(conversationId: string, userId: string) {
    const conversation = await this.assertConversationAccess(conversationId, userId);

    if (conversation.archived_at) {
      throw new BadRequestException('Conversation is already archived');
    }

    if (conversation.status === CHAT_PENDING_STATUS) {
      throw new BadRequestException('Pending consultations cannot be archived');
    }

    const updated = await this.prisma.expert_conversations.update({
      where: { id: conversationId },
      data: {
        archived_at: new Date(),
        archived_by: userId,
        updated_at: new Date(),
      },
      include: this.conversationInclude(),
    });

    this.realtime.broadcastConversation(updated);
    return updated;
  }

  async purgeExpiredArchivedConversations() {
    const cutoff = new Date(
      Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const expired = await this.prisma.expert_conversations.findMany({
      where: {
        archived_at: { not: null, lt: cutoff },
      },
      select: { id: true },
    });

    if (expired.length === 0) {
      return { deleted: 0 };
    }

    const result = await this.prisma.expert_conversations.deleteMany({
      where: {
        id: { in: expired.map((item) => item.id) },
      },
    });

    return { deleted: result.count };
  }

  private async getConversationForExpert(conversationId: string, expertId: string) {
    const conversation = await this.prisma.expert_conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.expert_id !== expertId) {
      throw new ForbiddenException('Only the assigned expert can update this conversation');
    }

    return conversation;
  }

  private conversationInclude() {
    return {
      expert: {
        select: { id: true, full_name: true, avatar_url: true },
      },
      customer: {
        select: { id: true, full_name: true, avatar_url: true },
      },
      my_plants: {
        select: { id: true, nickname: true },
      },
      expert_messages: {
        take: 1,
        orderBy: { created_at: 'desc' as const },
      },
    };
  }
}
