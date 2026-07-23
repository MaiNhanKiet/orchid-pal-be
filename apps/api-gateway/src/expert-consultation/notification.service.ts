import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/prisma';

export function userRoom(userId: string) {
  return `user:${userId}`;
}

@Injectable()
export class ConsultationRealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(conversationId).emit(event, payload);
  }

  emitConversationUpdated(userId: string, conversation: unknown) {
    this.emitToUser(userId, 'conversation_updated', conversation);
  }

  broadcastConversation(conversation: {
    id: string;
    customer_id?: string | null;
    expert_id?: string | null;
  }) {
    if (conversation.customer_id) {
      this.emitConversationUpdated(conversation.customer_id, conversation);
    }
    if (conversation.expert_id) {
      this.emitConversationUpdated(conversation.expert_id, conversation);
    }
  }
}

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  is_read: boolean;
  created_at: Date | null;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ConsultationRealtimeService,
  ) {}

  async create(params: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notifications.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: (params.data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    this.realtime.emitToUser(params.userId, 'notification', notification);
    return notification;
  }

  async listForUser(userId: string, limit = 30) {
    return this.prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.notifications.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  async markConversationRead(userId: string, conversationId: string) {
    const unread = await this.prisma.notifications.findMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      select: { id: true, data: true },
    });

    const ids = unread
      .filter((notification) => {
        const data = notification.data as Record<string, unknown> | null;
        return data?.conversation_id === conversationId;
      })
      .map((notification) => notification.id);

    if (ids.length === 0) {
      return { updated: 0, ids: [] as string[] };
    }

    await this.prisma.notifications.updateMany({
      where: {
        id: { in: ids },
        user_id: userId,
      },
      data: { is_read: true },
    });

    return { updated: ids.length, ids };
  }
}
