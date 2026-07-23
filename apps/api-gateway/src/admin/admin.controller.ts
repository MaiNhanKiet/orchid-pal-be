import { PaginationDto, Permissions } from '@app/common';
import { Permission } from '@app/common/enums';
import { PrismaService } from '@app/prisma';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../audit/audit.service';

@ApiTags('12 - Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Get('overview')
  @Permissions(Permission.SysAccessDashboard)
  async getOverview() {
    const [
      usersTotal,
      usersActive,
      pendingBlogs,
      publishedBlogs,
      feedbackTotal,
      devicesTotal,
      devicesOnline,
      recentAudit,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({ where: { is_active: true } }),
      this.prisma.expert_blogs.count({ where: { status: 'PENDING' } }),
      this.prisma.expert_blogs.count({
        where: { status: 'PUBLISHED', is_published: true },
      }),
      this.prisma.feedbacks.count(),
      this.prisma.devices.count(),
      this.prisma.devices.count({ where: { status: 'ONLINE' } }),
      this.auditService.list({ page: 1, limit: 8 }),
    ]);

    return {
      users: { total: usersTotal, active: usersActive },
      blogs: { pending: pendingBlogs, published: publishedBlogs },
      feedback: { total: feedbackTotal },
      devices: { total: devicesTotal, online: devicesOnline },
      recent_audit: recentAudit.data,
    };
  }

  @Get('audit-logs')
  @Permissions(Permission.SysViewLogs)
  listAuditLogs(
    @Query() pagination: PaginationDto,
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
  ) {
    return this.auditService.list({
      page: pagination.page,
      limit: pagination.limit,
      user_id: userId,
      action,
      entity: resource,
    });
  }
}
