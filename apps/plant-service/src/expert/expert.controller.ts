import {
  CreateExpertBlogDto,
  ReviewExpertBlogDto,
  SendExpertMessageDto,
  UpdateExpertBlogDto,
} from '@app/common/dtos/expert/expert.dto';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ExpertService } from './expert.service';

@Controller()
export class ExpertController {
  constructor(private readonly expertService: ExpertService) {}

  @GrpcCmd('create_expert_conversation')
  createConversation(
    @Payload() data: { user_id: string; related_plant_id?: string; topic?: string },
  ) {
    return this.expertService.createConversation(data.user_id, data);
  }

  @GrpcCmd('list_expert_conversations')
  listConversations(@Payload() data: { user_id: string; role?: 'customer' | 'expert' }) {
    return this.expertService.listMyConversations(data.user_id, data.role ?? 'customer');
  }

  @GrpcCmd('assign_expert_to_conversation')
  assignExpert(@Payload() data: { conversation_id: string; expert_id: string }) {
    return this.expertService.assignExpert(data.conversation_id, data.expert_id);
  }

  @GrpcCmd('send_expert_message')
  sendMessage(
    @Payload() data: { conversation_id: string; sender_id: string } & SendExpertMessageDto,
  ) {
    const { conversation_id, sender_id, ...dto } = data;
    return this.expertService.sendMessage(conversation_id, sender_id, dto);
  }

  @GrpcCmd('get_expert_messages')
  getMessages(@Payload() data: { conversation_id: string; user_id: string }) {
    return this.expertService.getMessages(data.conversation_id, data.user_id);
  }

  @GrpcCmd('create_expert_blog')
  createBlog(@Payload() data: { author_id: string } & CreateExpertBlogDto) {
    const { author_id, ...dto } = data;
    return this.expertService.createBlog(author_id, dto);
  }

  @GrpcCmd('list_expert_blogs')
  listBlogs() {
    return this.expertService.listPublishedBlogs();
  }

  @GrpcCmd('get_expert_blog_by_slug')
  getBlogBySlug(@Payload() data: { slug: string }) {
    return this.expertService.getPublishedBlogBySlug(data.slug);
  }

  @GrpcCmd('update_expert_blog')
  updateBlog(
    @Payload() data: { id: string; author_id: string } & UpdateExpertBlogDto,
  ) {
    const { id, author_id, ...dto } = data;
    return this.expertService.updateBlog(id, author_id, dto);
  }

  @GrpcCmd('list_expert_blogs_by_author')
  listBlogsByAuthor(@Payload() data: { author_id: string }) {
    return this.expertService.listBlogsByAuthor(data.author_id);
  }

  @GrpcCmd('get_expert_blog_by_id')
  getBlogById(@Payload() data: { id: string; author_id: string }) {
    return this.expertService.getBlogByIdForAuthor(data.id, data.author_id);
  }

  @GrpcCmd('submit_expert_blog')
  submitBlog(@Payload() data: { id: string; author_id: string }) {
    return this.expertService.submitBlogForReview(data.id, data.author_id);
  }

  @GrpcCmd('list_pending_expert_blogs')
  listPendingBlogs(@Payload() data: { admin_id: string }) {
    return this.expertService.listPendingBlogsForReview(data.admin_id);
  }

  @GrpcCmd('review_expert_blog')
  reviewBlog(
    @Payload() data: { id: string; admin_id: string } & ReviewExpertBlogDto,
  ) {
    const { id, admin_id, ...dto } = data;
    return this.expertService.reviewBlog(id, admin_id, dto);
  }

  @GrpcCmd('unpublish_expert_blog')
  unpublishBlog(@Payload() data: { id: string; admin_id: string }) {
    return this.expertService.unpublishBlog(data.id, data.admin_id);
  }

  @GrpcCmd('republish_expert_blog')
  republishBlog(@Payload() data: { id: string; admin_id: string }) {
    return this.expertService.republishBlog(data.id, data.admin_id);
  }

  @GrpcCmd('list_admin_expert_blogs')
  listAdminBlogs(@Payload() data: { admin_id: string; status?: string }) {
    return this.expertService.listAdminBlogs(data.admin_id, data.status);
  }
}
