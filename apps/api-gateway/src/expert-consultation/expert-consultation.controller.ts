import { CurrentUser, JwtPayload, Permissions, Public } from '@app/common';
import { Permission } from '@app/common/enums';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CHAT_UPLOAD_MAX_BYTES } from './chat.constants';
import { CloudinaryService } from './cloudinary.service';
import { CreateConversationDto, ListConversationsQueryDto, UpdateExpertProfileDto, UpdateMessageDto } from './dto';
import { ExpertConsultationService } from './expert-consultation.service';
import { NotificationService } from './notification.service';

@ApiTags('10 - Expert Consultation')
@ApiBearerAuth('access-token')
@Controller()
export class ExpertConsultationController {
  constructor(
    private readonly expertConsultationService: ExpertConsultationService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('experts')
  @Public()
  @ApiOperation({ summary: 'List available plant experts' })
  listExperts() {
    return this.expertConsultationService.listExperts();
  }

  @Get('experts/me')
  @Permissions(Permission.MeProfileUpdate)
  @ApiOperation({ summary: 'Get the authenticated expert profile' })
  getMyExpertProfile(@CurrentUser() user: JwtPayload) {
    return this.expertConsultationService.getMyExpertProfile(user.sub);
  }

  @Patch('experts/me')
  @Permissions(Permission.MeProfileUpdate)
  @ApiOperation({ summary: 'Update the authenticated expert profile' })
  updateMyExpertProfile(
    @Body() dto: UpdateExpertProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expertConsultationService.updateMyExpertProfile(user.sub, dto);
  }

  @Get('experts/:id')
  @Public()
  @ApiOperation({ summary: 'Get a public expert profile' })
  getExpertById(@Param('id') id: string) {
    return this.expertConsultationService.getExpertById(id);
  }

  @Get('conversations')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'List conversations for the authenticated user' })
  listConversations(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListConversationsQueryDto,
  ) {
    return this.expertConsultationService.listConversationsForUser(
      user.sub,
      query.filter ?? 'all',
    );
  }

  @Post('conversations')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Book a new expert consultation' })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expertConsultationService.createConversation(user.sub, dto);
  }

  @Patch('conversations/:id/accept')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Expert accepts a pending consultation request' })
  acceptConversation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expertConsultationService.acceptConversation(id, user.sub);
  }

  @Patch('conversations/:id/reject')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Expert rejects a pending consultation request' })
  rejectConversation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expertConsultationService.rejectConversation(id, user.sub);
  }

  @Patch('conversations/:id/close')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Expert closes an active consultation (history preserved)' })
  closeConversation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expertConsultationService.closeConversation(id, user.sub);
  }

  @Patch('conversations/:id/archive')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Archive a consultation (auto-deleted after 7 days)' })
  archiveConversation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expertConsultationService.archiveConversation(id, user.sub);
  }

  @Get('notifications')
  @Permissions(Permission.NotificationRead)
  @ApiOperation({ summary: 'List notifications for the authenticated user' })
  listNotifications(@CurrentUser() user: JwtPayload) {
    return this.notificationService.listForUser(user.sub);
  }

  @Get('notifications/unread-count')
  @Permissions(Permission.NotificationRead)
  @ApiOperation({ summary: 'Unread notification count' })
  unreadNotificationCount(@CurrentUser() user: JwtPayload) {
    return this.notificationService.unreadCount(user.sub);
  }

  @Patch('notifications/by-conversation/:conversationId/read')
  @Permissions(Permission.NotificationRead)
  @ApiOperation({ summary: 'Mark chat notifications for a conversation as read' })
  async markConversationNotificationsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationService.markConversationRead(user.sub, conversationId);
  }

  @Patch('notifications/:id/read')
  @Permissions(Permission.NotificationRead)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.notificationService.markRead(user.sub, id);
    return { success: true };
  }

  @Patch('notifications/read-all')
  @Permissions(Permission.NotificationRead)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllNotificationsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationService.markAllRead(user.sub);
    return { success: true };
  }

  @Get('conversations/:id/messages')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Get messages for a conversation' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('since') since?: string,
  ) {
    return this.expertConsultationService.getMessages(id, user.sub, since);
  }

  @Patch('conversations/:conversationId/messages/:messageId')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Edit a message you sent' })
  updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expertConsultationService.updateMessage(
      conversationId,
      messageId,
      user.sub,
      dto,
    );
  }

  @Delete('conversations/:conversationId/messages/:messageId')
  @Permissions(Permission.ExpertConsult)
  @ApiOperation({ summary: 'Delete a message for everyone' })
  deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expertConsultationService.deleteMessage(
      conversationId,
      messageId,
      user.sub,
    );
  }

  @Post('uploads/chat-image')
  @Permissions(Permission.MediaUpload)
  @ApiOperation({ summary: 'Upload a chat image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: CHAT_UPLOAD_MAX_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image uploads are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadChatImage(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const url = await this.cloudinaryService.uploadChatImage(
      file.buffer,
      `expert-chat/${user.sub}`,
    );
    return { url };
  }

  @Delete('uploads/chat-image')
  @Permissions(Permission.MediaDelete)
  @ApiOperation({ summary: 'Delete a chat image from Cloudinary' })
  async deleteChatImage(
    @Body() body: { url?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!body?.url) {
      throw new BadRequestException('Image URL is required');
    }

    try {
      await this.cloudinaryService.deleteChatImage(body.url, user.sub);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete image',
      );
    }
  }
}
