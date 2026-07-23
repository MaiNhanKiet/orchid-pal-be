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
import {
  CreateConversationDto,
  CreateExpertBlogDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  Public,
  ReviewExpertBlogDto,
  SendExpertMessageDto,
  UpdateExpertBlogDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../../expert-consultation/cloudinary.service';
import { CHAT_UPLOAD_MAX_BYTES } from '../../expert-consultation/chat.constants';
import { NotificationService } from '../../expert-consultation/notification.service';
import {
  ApiCreateConversationDocs,
  ApiCreateExpertBlogDocs,
  ApiGetExpertMessagesDocs,
  ApiListConversationsDocs,
  ApiListExpertBlogsDocs,
  ApiGetExpertBlogBySlugDocs,
  ApiSendExpertMessageDocs,
} from './expert.swagger';

type ReviewedBlog = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  status: string;
  rejection_reason?: string | null;
};

@ApiTags('09 - Expert Care')
@ApiBearerAuth('access-token')
@Controller('expert')
export class ExpertController {
  constructor(
    private readonly grpcRpc: GrpcRpcService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('conversations')
  @Permissions(Permission.ExpertConsult)
  @ApiCreateConversationDocs()
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'create_expert_conversation',
      { user_id: user.sub, ...dto },
    );
  }

  @Get('conversations')
  @Permissions(Permission.ExpertConsult)
  @ApiListConversationsDocs()
  listConversations(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: 'customer' | 'expert',
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'list_expert_conversations',
      { user_id: user.sub, role },
    );
  }

  @Get('conversations/:id/messages')
  @Permissions(Permission.ExpertConsult)
  @ApiGetExpertMessagesDocs()
  getMessages(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_expert_messages', {
      conversation_id: id,
      user_id: user.sub,
    });
  }

  @Post('conversations/:id/messages')
  @Permissions(Permission.ExpertConsult)
  @ApiSendExpertMessageDocs()
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendExpertMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'send_expert_message', {
      conversation_id: id,
      sender_id: user.sub,
      ...dto,
    });
  }

  @Get('blogs')
  @Public()
  @ApiListExpertBlogsDocs()
  listBlogs() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'list_expert_blogs', {});
  }

  @Get('blogs/mine')
  @Permissions(Permission.ExpertBlogWrite)
  listMyBlogs(@CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'list_expert_blogs_by_author', {
      author_id: user.sub,
    });
  }

  @Get('blogs/reviews')
  @Permissions(Permission.ExpertBlogReview)
  listBlogsForReview(@CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'list_pending_expert_blogs', {
      admin_id: user.sub,
    });
  }

  @Get('blogs/admin')
  @Permissions(Permission.ExpertBlogReview)
  listAdminBlogs(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'list_admin_expert_blogs', {
      admin_id: user.sub,
      status,
    });
  }

  @Get('blogs/manage/:id')
  @Permissions(Permission.ExpertBlogWrite)
  getMyBlog(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_expert_blog_by_id', {
      id,
      author_id: user.sub,
    });
  }

  @Get('blogs/:slug')
  @Public()
  @ApiGetExpertBlogBySlugDocs()
  getBlogBySlug(@Param('slug') slug: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_expert_blog_by_slug', {
      slug,
    });
  }

  @Post('blogs')
  @Permissions(Permission.ExpertBlogWrite)
  @ApiCreateExpertBlogDocs()
  async createBlog(@Body() dto: CreateExpertBlogDto, @CurrentUser() user: JwtPayload) {
    const blog = (await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'create_expert_blog',
      {
        author_id: user.sub,
        ...dto,
      },
    )) as ReviewedBlog;

    if (dto.submit_for_review) {
      await this.notifyBlogSubmitted(blog, user.sub);
    }

    return blog;
  }

  @Patch('blogs/manage/:id')
  @Permissions(Permission.ExpertBlogWrite)
  async updateBlog(
    @Param('id') id: string,
    @Body() dto: UpdateExpertBlogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const blog = (await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'update_expert_blog',
      {
        id,
        author_id: user.sub,
        ...dto,
      },
    )) as ReviewedBlog;

    if (dto.submit_for_review) {
      await this.notifyBlogSubmitted(blog, user.sub);
    }

    return blog;
  }

  @Post('blogs/manage/:id/submit')
  @Permissions(Permission.ExpertBlogWrite)
  async submitBlog(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const blog = (await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'submit_expert_blog',
      {
        id,
        author_id: user.sub,
      },
    )) as ReviewedBlog;

    await this.notifyBlogSubmitted(blog, user.sub);

    return blog;
  }

  private async notifyBlogSubmitted(blog: ReviewedBlog, userId: string) {
    await this.notificationService.create({
      userId,
      type: 'BLOG_SUBMITTED',
      title: 'Article submitted for review',
      body: `"${blog.title}" is now waiting for admin approval.`,
      data: {
        blog_id: blog.id,
        blog_slug: blog.slug,
        blog_title: blog.title,
        status: blog.status,
      },
    });
  }

  @Patch('blogs/reviews/:id')
  @Permissions(Permission.ExpertBlogReview)
  async reviewBlog(
    @Param('id') id: string,
    @Body() dto: ReviewExpertBlogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const blog = (await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'review_expert_blog',
      {
        id,
        admin_id: user.sub,
        ...dto,
      },
    )) as ReviewedBlog;

    if (blog.author_id) {
      if (dto.approve) {
        await this.notificationService.create({
          userId: blog.author_id,
          type: 'BLOG_PUBLISHED',
          title: 'Your article was published',
          body: `"${blog.title}" is now live on the PlantPal blog.`,
          data: {
            blog_id: blog.id,
            blog_slug: blog.slug,
            blog_title: blog.title,
            status: blog.status,
          },
        });
      } else {
        const reason = dto.rejection_reason?.trim() ?? '';
        await this.notificationService.create({
          userId: blog.author_id,
          type: 'BLOG_REJECTED',
          title: 'Article needs revision',
          body: reason
            ? `"${blog.title}" was not approved. Reason: ${reason}`
            : `"${blog.title}" was not approved. Please revise and resubmit.`,
          data: {
            blog_id: blog.id,
            blog_slug: blog.slug,
            blog_title: blog.title,
            status: blog.status,
            rejection_reason: reason,
          },
        });
      }
    }

    return blog;
  }

  @Patch('blogs/reviews/:id/unpublish')
  @Permissions(Permission.ExpertBlogReview)
  async unpublishBlog(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const blog = (await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'unpublish_expert_blog',
      {
        id,
        admin_id: user.sub,
      },
    )) as ReviewedBlog;

    if (blog.author_id) {
      await this.notificationService.create({
        userId: blog.author_id,
        type: 'BLOG_UNPUBLISHED',
        title: 'Article unpublished',
        body: `"${blog.title}" was removed from the public blog by an administrator.`,
        data: {
          blog_id: blog.id,
          blog_slug: blog.slug,
          blog_title: blog.title,
          status: blog.status,
        },
      });
    }

    return blog;
  }

  @Patch('blogs/reviews/:id/publish')
  @Permissions(Permission.ExpertBlogReview)
  async republishBlog(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const blog = (await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'republish_expert_blog',
      {
        id,
        admin_id: user.sub,
      },
    )) as ReviewedBlog;

    if (blog.author_id) {
      await this.notificationService.create({
        userId: blog.author_id,
        type: 'BLOG_PUBLISHED',
        title: 'Your article was republished',
        body: `"${blog.title}" is live again on the PlantPal blog.`,
        data: {
          blog_id: blog.id,
          blog_slug: blog.slug,
          blog_title: blog.title,
          status: blog.status,
        },
      });
    }

    return blog;
  }

  @Post('blogs/uploads/cover')
  @Permissions(Permission.MediaUpload)
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
  async uploadBlogCover(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const url = await this.cloudinaryService.uploadBlogCover(file.buffer, user.sub);
    return { url };
  }

  @Delete('blogs/uploads/cover')
  @Permissions(Permission.MediaDelete)
  async deleteBlogCover(
    @Body() body: { url?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!body?.url) {
      throw new BadRequestException('Image URL is required');
    }

    try {
      await this.cloudinaryService.deleteBlogCover(body.url, user.sub);
      return { success: true };
    } catch {
      throw new BadRequestException('Failed to delete image');
    }
  }
}
