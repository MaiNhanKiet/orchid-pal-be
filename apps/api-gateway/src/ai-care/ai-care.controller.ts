import { CurrentUser, JwtPayload, Permissions } from '@app/common';
import { Permission } from '@app/common/enums';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AI_CHAT_UPLOAD_MAX_BYTES } from './ai-care.constants';
import { AiCareService } from './ai-care.service';
import { CreateAiChatSessionDto } from './dto/create-ai-chat-session.dto';
import { ListAiChatMessagesQueryDto } from './dto/list-ai-chat-messages-query.dto';

@ApiTags('12 - AI Care')
@ApiBearerAuth('access-token')
@Controller('chat/sessions')
export class AiCareController {
  constructor(private readonly aiCareService: AiCareService) {}

  @Get()
  @Permissions(Permission.ChatManage)
  @ApiOperation({ summary: 'List AI chat sessions for the authenticated user' })
  listSessions(@CurrentUser() user: JwtPayload) {
    return this.aiCareService.listSessions(user.sub);
  }

  @Post()
  @Permissions(Permission.ChatManage)
  @ApiOperation({ summary: 'Create a new AI chat session' })
  createSession(
    @Body() dto: CreateAiChatSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.aiCareService.createSession(user.sub, dto);
  }

  @Get(':sessionId/messages')
  @Permissions(Permission.ChatManage)
  @ApiOperation({ summary: 'Get paginated messages for an AI chat session' })
  getMessages(
    @Param('sessionId') sessionId: string,
    @Query() query: ListAiChatMessagesQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.aiCareService.getMessages(user.sub, sessionId, query);
  }

  @Post(':sessionId/messages')
  @Permissions(Permission.ChatManage)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Send a message and receive an AI reply' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: AI_CHAT_UPLOAD_MAX_BYTES },
    }),
  )
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body('content') content: string,
    @UploadedFile() image: { buffer: Buffer; mimetype: string } | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (image && !image.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported');
    }

    return this.aiCareService.sendMessage(
      user.sub,
      sessionId,
      content ?? '',
      image?.buffer,
    );
  }

  @Delete(':sessionId')
  @Permissions(Permission.ChatManage)
  @ApiOperation({ summary: 'Clear all messages in an AI chat session' })
  deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.aiCareService.deleteSession(user.sub, sessionId);
  }
}
