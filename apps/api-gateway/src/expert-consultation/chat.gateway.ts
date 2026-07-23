import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './dto';
import { ChatRateLimitService } from './chat-rate-limit.service';
import { ExpertConsultationService } from './expert-consultation.service';
import {
  ConsultationRealtimeService,
  userRoom,
} from './notification.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    joinedRoom?: string | null;
  };
}

interface MessageAckPayload {
  status: 'sent' | 'failed';
  client_message_id?: string;
  message?: unknown;
  error?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/expert-consultation',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly expertConsultationService: ExpertConsultationService,
    private readonly chatRateLimitService: ChatRateLimitService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly realtime: ConsultationRealtimeService,
  ) {}

  afterInit() {
    this.realtime.setServer(this.server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new WsException('Missing auth token');
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.joinedRoom = null;
      await client.join(userRoom(payload.sub));

      const sockets = await this.server.in(userRoom(payload.sub)).fetchSockets();
      if (sockets.length === 1) {
        void this.broadcastUserPresenceAcrossConversations(payload.sub, true);
      }
    } catch (error) {
      this.logger.warn(`WS connection rejected: ${String(error)}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.userId;

    this.leaveTrackedRoom(client);
    client.removeAllListeners();

    if (!userId) return;

    const stillOnline = await this.isUserOnline(userId, client.id);
    if (!stillOnline) {
      void this.broadcastUserPresenceAcrossConversations(userId, false);
    }
  }

  private async isUserOnline(
    userId: string,
    excludeSocketId?: string,
  ): Promise<boolean> {
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    return sockets.some((socket) => socket.id !== excludeSocketId);
  }

  private async broadcastUserPresenceAcrossConversations(
    userId: string,
    isOnline: boolean,
  ) {
    const conversations =
      await this.expertConsultationService.listConversationPresenceTargets(
        userId,
      );

    for (const conversation of conversations) {
      this.server.to(conversation.id).emit('presence', {
        conversation_id: conversation.id,
        user_id: userId,
        is_online: isOnline,
      });
    }
  }

  private async emitPartnerPresence(
    client: AuthenticatedSocket,
    conversationId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const conversation = await this.expertConsultationService
      .getConversationParticipants(conversationId)
      .catch(() => null);

    if (!conversation) return;

    const partnerId =
      conversation.customer_id === userId
        ? conversation.expert_id
        : conversation.customer_id;

    if (!partnerId) return;

    const partnerOnline = await this.isUserOnline(partnerId);

    client.emit('presence', {
      conversation_id: conversationId,
      user_id: partnerId,
      is_online: partnerOnline,
    });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    this.leaveTrackedRoom(client);
    return { success: true };
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { conversation_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!data?.conversation_id) {
      return { success: false, message: 'conversation_id is required' };
    }

    await this.expertConsultationService.assertConversationAccess(
      data.conversation_id,
      userId,
    );

    this.leaveTrackedRoom(client);
    await client.join(data.conversation_id);
    client.data.joinedRoom = data.conversation_id;

    await this.emitPartnerPresence(client, data.conversation_id);

    return { success: true, conversation_id: data.conversation_id };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<MessageAckPayload> {
    const senderId = client.data.userId;
    if (!senderId) {
      throw new WsException('Unauthorized');
    }

    if (!data?.conversation_id) {
      return {
        status: 'failed',
        client_message_id: data?.client_message_id,
        error: 'conversation_id is required',
      };
    }

    if (client.data.joinedRoom !== data.conversation_id) {
      return {
        status: 'failed',
        client_message_id: data.client_message_id,
        error: 'Join the conversation room before sending messages',
      };
    }

    try {
      await this.chatRateLimitService.assertWithinLimit(senderId);

      const message = await this.expertConsultationService.sendMessage(
        data.conversation_id,
        senderId,
        {
          content: data.content,
          image_urls: data.image_urls,
          client_message_id: data.client_message_id,
        },
      );

      this.server.to(data.conversation_id).emit('receive_message', message);

      client.emit('message_ack', {
        status: 'sent',
        client_message_id: data.client_message_id,
        message,
      } satisfies MessageAckPayload);

      return {
        status: 'sent',
        client_message_id: data.client_message_id,
        message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';

      client.emit('message_ack', {
        status: 'failed',
        client_message_id: data.client_message_id,
        error: errorMessage,
      } satisfies MessageAckPayload);

      return {
        status: 'failed',
        client_message_id: data.client_message_id,
        error: errorMessage,
      };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { conversation_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversation_id) return { success: false };
    if (client.data.joinedRoom !== data.conversation_id) {
      return { success: false, message: 'Join the conversation room first' };
    }

    client.to(data.conversation_id).emit('typing', {
      conversation_id: data.conversation_id,
      user_id: userId,
      is_typing: true,
    });

    return { success: true };
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { conversation_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversation_id) return { success: false };
    if (client.data.joinedRoom !== data.conversation_id) {
      return { success: false, message: 'Join the conversation room first' };
    }

    client.to(data.conversation_id).emit('typing', {
      conversation_id: data.conversation_id,
      user_id: userId,
      is_typing: false,
    });

    return { success: true };
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @MessageBody()
    data: { conversation_id: string; message_id: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!data?.conversation_id || !data?.message_id || !data?.content?.trim()) {
      return { success: false, message: 'conversation_id, message_id, and content are required' };
    }

    if (client.data.joinedRoom !== data.conversation_id) {
      return { success: false, message: 'Join the conversation room first' };
    }

    try {
      const message = await this.expertConsultationService.updateMessage(
        data.conversation_id,
        data.message_id,
        userId,
        { content: data.content },
      );
      return { success: true, message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to edit message',
      };
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: { conversation_id: string; message_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!data?.conversation_id || !data?.message_id) {
      return { success: false, message: 'conversation_id and message_id are required' };
    }

    if (client.data.joinedRoom !== data.conversation_id) {
      return { success: false, message: 'Join the conversation room first' };
    }

    try {
      const message = await this.expertConsultationService.deleteMessage(
        data.conversation_id,
        data.message_id,
        userId,
      );
      return { success: true, message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete message',
      };
    }
  }

  private leaveTrackedRoom(client: AuthenticatedSocket) {
    const room = client.data.joinedRoom;
    if (!room) return;

    client.leave(room);
    client.data.joinedRoom = null;
  }
}
