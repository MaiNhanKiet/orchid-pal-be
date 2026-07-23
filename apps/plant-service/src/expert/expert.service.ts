import {
  CreateExpertBlogDto,
  ReviewExpertBlogDto,
  SendExpertMessageDto,
  UpdateExpertBlogDto,
} from '@app/common/dtos/expert/expert.dto';
import { EXPERT_BLOG_STATUS } from '@app/common/constants/expert-blog-status';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const BLOG_AUTHOR_SELECT = {
  users: {
    select: {
      id: true,
      full_name: true,
      avatar_url: true,
      expert_profile: {
        select: { specialty: true },
      },
    },
  },
} as const;

@Injectable()
export class ExpertService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(customer_id: string, data: { related_plant_id?: string; topic?: string }) {
    return this.prisma.expert_conversations.create({
      data: {
        customer_id,
        related_plant_id: data.related_plant_id,
        topic: data.topic,
        status: 'OPEN',
      },
    });
  }

  async listMyConversations(user_id: string, role: 'customer' | 'expert') {
    const where =
      role === 'expert' ? { expert_id: user_id } : { customer_id: user_id };
    return this.prisma.expert_conversations.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        expert_messages: { take: 1, orderBy: { created_at: 'desc' } },
        my_plants: { select: { nickname: true } },
      },
    });
  }

  async assignExpert(conversation_id: string, expert_id: string) {
    const conv = await this.prisma.expert_conversations.findUnique({
      where: { id: conversation_id },
    });
    if (!conv) throw new NotFoundException('Cuộc hội thoại không tồn tại');

    return this.prisma.expert_conversations.update({
      where: { id: conversation_id },
      data: { expert_id, status: 'IN_PROGRESS' },
    });
  }

  async sendMessage(conversation_id: string, sender_id: string, data: SendExpertMessageDto) {
    const conv = await this.prisma.expert_conversations.findUnique({
      where: { id: conversation_id },
    });
    if (!conv) throw new NotFoundException('Cuộc hội thoại không tồn tại');
    if (conv.customer_id !== sender_id && conv.expert_id !== sender_id) {
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này');
    }

    const message = await this.prisma.expert_messages.create({
      data: {
        conversation_id,
        sender_id,
        content: data.content,
        image_urls: data.image_urls,
      },
    });

    await this.prisma.expert_conversations.update({
      where: { id: conversation_id },
      data: { updated_at: new Date() },
    });

    return message;
  }

  async getMessages(conversation_id: string, user_id: string) {
    const conv = await this.prisma.expert_conversations.findUnique({
      where: { id: conversation_id },
    });
    if (!conv) throw new NotFoundException('Cuộc hội thoại không tồn tại');
    if (conv.customer_id !== user_id && conv.expert_id !== user_id) {
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này');
    }

    return this.prisma.expert_messages.findMany({
      where: { conversation_id },
      orderBy: { created_at: 'asc' },
    });
  }

  private resolveInitialBlogStatus(submit_for_review?: boolean) {
    return submit_for_review
      ? EXPERT_BLOG_STATUS.PENDING
      : EXPERT_BLOG_STATUS.DRAFT;
  }

  private slugifyTitle(title: string) {
    return title
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 200);
  }

  private assertBlogReadyForReview(title?: string, content?: string) {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required to submit for review');
    }
    if (!content?.trim() || content.trim().length < 20) {
      throw new BadRequestException(
        'Content must be at least 20 characters to submit for review',
      );
    }
  }

  async createBlog(author_id: string, data: CreateExpertBlogDto) {
    if (data.submit_for_review) {
      this.assertBlogReadyForReview(data.title, data.content);
    }

    const slug =
      data.slug?.trim() ||
      this.slugifyTitle(data.title) ||
      `draft-${Date.now()}`;

    const status = this.resolveInitialBlogStatus(data.submit_for_review);

    return this.prisma.expert_blogs.create({
      data: {
        author_id,
        title: data.title.trim(),
        slug,
        summary: data.summary,
        content: data.content?.trim() ?? '',
        cover_image_url: data.cover_image_url,
        tags: data.tags,
        status,
        is_published: false,
        published_at: null,
      },
    });
  }

  async listPublishedBlogs() {
    return this.prisma.expert_blogs.findMany({
      where: {
        status: EXPERT_BLOG_STATUS.PUBLISHED,
        is_published: true,
      },
      orderBy: { published_at: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        cover_image_url: true,
        tags: true,
        views_count: true,
        published_at: true,
        status: true,
        ...BLOG_AUTHOR_SELECT,
      },
    });
  }

  async listBlogsByAuthor(author_id: string) {
    return this.prisma.expert_blogs.findMany({
      where: { author_id },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        cover_image_url: true,
        tags: true,
        status: true,
        rejection_reason: true,
        is_published: true,
        published_at: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async getBlogByIdForAuthor(id: string, author_id: string) {
    const blog = await this.prisma.expert_blogs.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Bài viết không tồn tại');
    if (blog.author_id !== author_id) throw new ForbiddenException('Không có quyền');
    return blog;
  }

  async updateBlog(id: string, author_id: string, data: UpdateExpertBlogDto) {
    const blog = await this.prisma.expert_blogs.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Bài viết không tồn tại');
    if (blog.author_id !== author_id) throw new ForbiddenException('Không có quyền');

    const editableStatuses = [
      EXPERT_BLOG_STATUS.DRAFT,
      EXPERT_BLOG_STATUS.REJECTED,
    ];
    if (!editableStatuses.includes(blog.status as typeof EXPERT_BLOG_STATUS.DRAFT)) {
      throw new BadRequestException('Chỉ có thể chỉnh sửa bài nháp hoặc bài bị từ chối');
    }

    const { submit_for_review, ...fields } = data;
    if (submit_for_review) {
      this.assertBlogReadyForReview(
        fields.title ?? blog.title,
        fields.content ?? blog.content,
      );
    }

    const nextStatus = submit_for_review
      ? EXPERT_BLOG_STATUS.PENDING
      : blog.status;

    return this.prisma.expert_blogs.update({
      where: { id },
      data: {
        ...fields,
        status: nextStatus,
        rejection_reason: submit_for_review ? null : blog.rejection_reason,
        reviewed_by: submit_for_review ? null : blog.reviewed_by,
        reviewed_at: submit_for_review ? null : blog.reviewed_at,
        updated_at: new Date(),
      },
    });
  }

  async submitBlogForReview(id: string, author_id: string) {
    const blog = await this.prisma.expert_blogs.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Bài viết không tồn tại');
    if (blog.author_id !== author_id) throw new ForbiddenException('Không có quyền');

    const submittable = [
      EXPERT_BLOG_STATUS.DRAFT,
      EXPERT_BLOG_STATUS.REJECTED,
    ];
    if (!submittable.includes(blog.status as typeof EXPERT_BLOG_STATUS.DRAFT)) {
      throw new BadRequestException('Bài viết không thể gửi duyệt ở trạng thái hiện tại');
    }

    return this.prisma.expert_blogs.update({
      where: { id },
      data: {
        status: EXPERT_BLOG_STATUS.PENDING,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date(),
      },
    });
  }

  async getPublishedBlogBySlug(slug: string) {
    const blog = await this.prisma.expert_blogs.findFirst({
      where: {
        slug,
        status: EXPERT_BLOG_STATUS.PUBLISHED,
        is_published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        cover_image_url: true,
        tags: true,
        views_count: true,
        published_at: true,
        created_at: true,
        status: true,
        ...BLOG_AUTHOR_SELECT,
      },
    });

    if (!blog) throw new NotFoundException('Bài viết không tồn tại');

    void this.prisma.expert_blogs
      .update({
        where: { id: blog.id },
        data: { views_count: { increment: 1 } },
      })
      .catch(() => undefined);

    return blog;
  }

  private async assertSuperAdmin(user_id: string) {
    const assignment = await this.prisma.user_roles.findFirst({
      where: {
        user_id,
        roles: { name: 'SUPER_ADMIN' },
      },
    });
    if (!assignment) {
      throw new ForbiddenException('Chỉ admin mới có quyền duyệt bài viết');
    }
  }

  async listPendingBlogsForReview(admin_id: string) {
    await this.assertSuperAdmin(admin_id);

    return this.prisma.expert_blogs.findMany({
      where: { status: EXPERT_BLOG_STATUS.PENDING },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        cover_image_url: true,
        tags: true,
        status: true,
        created_at: true,
        updated_at: true,
        ...BLOG_AUTHOR_SELECT,
      },
    });
  }

  async reviewBlog(id: string, admin_id: string, data: ReviewExpertBlogDto) {
    await this.assertSuperAdmin(admin_id);

    const blog = await this.prisma.expert_blogs.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Bài viết không tồn tại');
    if (blog.status !== EXPERT_BLOG_STATUS.PENDING) {
      throw new BadRequestException('Chỉ có thể duyệt bài đang chờ phê duyệt');
    }

    if (data.approve) {
      return this.prisma.expert_blogs.update({
        where: { id },
        data: {
          status: EXPERT_BLOG_STATUS.PUBLISHED,
          is_published: true,
          published_at: new Date(),
          reviewed_by: admin_id,
          reviewed_at: new Date(),
          rejection_reason: null,
          updated_at: new Date(),
        },
      });
    }

    if (!data.rejection_reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }

    return this.prisma.expert_blogs.update({
      where: { id },
      data: {
        status: EXPERT_BLOG_STATUS.REJECTED,
        is_published: false,
        published_at: null,
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        rejection_reason: data.rejection_reason.trim(),
        updated_at: new Date(),
      },
    });
  }

  async unpublishBlog(id: string, admin_id: string) {
    await this.assertSuperAdmin(admin_id);

    const blog = await this.prisma.expert_blogs.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Bài viết không tồn tại');
    if (blog.status !== EXPERT_BLOG_STATUS.PUBLISHED) {
      throw new BadRequestException('Chỉ có thể gỡ bài đã xuất bản');
    }

    return this.prisma.expert_blogs.update({
      where: { id },
      data: {
        status: EXPERT_BLOG_STATUS.UNPUBLISHED,
        is_published: false,
        published_at: null,
        updated_at: new Date(),
      },
    });
  }

  async republishBlog(id: string, admin_id: string) {
    await this.assertSuperAdmin(admin_id);

    const blog = await this.prisma.expert_blogs.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Bài viết không tồn tại');

    const isUnpublished =
      blog.status === EXPERT_BLOG_STATUS.UNPUBLISHED ||
      (blog.status === EXPERT_BLOG_STATUS.DRAFT &&
        blog.reviewed_at != null &&
        !blog.is_published);

    if (!isUnpublished) {
      throw new BadRequestException('Chỉ có thể publish lại bài đã gỡ xuất bản');
    }

    return this.prisma.expert_blogs.update({
      where: { id },
      data: {
        status: EXPERT_BLOG_STATUS.PUBLISHED,
        is_published: true,
        published_at: new Date(),
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async listAdminBlogs(admin_id: string, status?: string) {
    await this.assertSuperAdmin(admin_id);

    const where =
      status === EXPERT_BLOG_STATUS.UNPUBLISHED
        ? {
            OR: [
              { status: EXPERT_BLOG_STATUS.UNPUBLISHED },
              {
                status: EXPERT_BLOG_STATUS.DRAFT,
                reviewed_at: { not: null },
                is_published: false,
              },
            ],
          }
        : status
          ? { status }
          : undefined;

    return this.prisma.expert_blogs.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        cover_image_url: true,
        tags: true,
        status: true,
        views_count: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        ...BLOG_AUTHOR_SELECT,
      },
    });
  }
}
