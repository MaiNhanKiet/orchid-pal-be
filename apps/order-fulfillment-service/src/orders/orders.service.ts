import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import { UpdateOrderDto } from '@app/common/dtos/order-fulfillment/update-order.dto';
import { PrismaService } from '@app/prisma';
import { OrderStatus, TransactionStatus } from '@app/common/enums';
import { GhnService } from '../shipments/ghn.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private ghnService: GhnService,
  ) {}

  private async enrichOrdersWithGhnStatus(orders: any[]) {
    return Promise.all(
      orders.map(async (order) => {
        if (order.shipments && order.shipments.length > 0) {
          const enrichedShipments = await Promise.all(
            order.shipments.map(async (shipment) => {
              let ghn_status = null;
              if (shipment.tracking_code) {
                ghn_status = await this.ghnService.getOrderStatus(
                  shipment.tracking_code,
                );
              }
              return { ...shipment, ghn_status };
            }),
          );
          return { ...order, shipments: enrichedShipments };
        }
        return order;
      }),
    );
  }

  async getAllOrders() {
    const orders = await this.prisma.orders.findMany({
      include: {
        order_items: true,
        shipments: true,
        users: { select: { id: true, full_name: true, email: true } },
        transactions: {
          select: { id: true, amount: true, method: true, paid_at: true},
          orderBy: { paid_at: 'desc' },
          take: 1,
        },
      },
    });
    return this.enrichOrdersWithGhnStatus(orders);
  }

  async getOrdersByUserId(
    userId: string,
    { page, limit }: { page?: number; limit?: number },
  ) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const orders = await this.prisma.orders.findMany({
      where: {
        user_id: userId,
      },
      include: {
        order_items: true,
        shipments: true,
        users: { select: { id: true, full_name: true, email: true } },
        transactions: {
          select: { id: true, amount: true, method: true, paid_at: true },
          orderBy: { paid_at: 'desc' },
          take: 1,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return this.enrichOrdersWithGhnStatus(orders);
  }

  async getOrderById(id: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: true,
        shipments: true,
        users: { select: { id: true, full_name: true, email: true } },
        transactions: {
          select: { id: true, amount: true, method: true, paid_at: true },
          orderBy: { paid_at: 'desc' },
          take: 1,
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    const [enrichedOrder] = await this.enrichOrdersWithGhnStatus([order]);
    return enrichedOrder;
  }

  async updateOrder(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.orders.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    return this.prisma.orders.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.shipping_info !== undefined && {
          shipping_info: dto.shipping_info,
        }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });
  }

  async bulkUpdateOrderStatus(orderIds: string[], status: string) {
    if (!orderIds || orderIds.length === 0) {
      throw new BadRequestException(
        'Bắt buộc phải cung cấp danh sách orderIds',
      );
    }

    const upperStatus = status.toUpperCase() as OrderStatus;
    if (!Object.values(OrderStatus).includes(upperStatus)) {
      throw new BadRequestException(`Trạng thái không hợp lệ: ${status}`);
    }

    const result = await this.prisma.orders.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: {
        status: upperStatus,
      },
    });

    return {
      message: `Đã cập nhật trạng thái thành công cho ${result.count} đơn hàng`,
      count: result.count,
    };
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.orders.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    await this.prisma.orders.delete({ where: { id } });
    return { message: 'Order deleted successfully' };
  }

  async cancelOrder(userId: string, id: string, reason?: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        shipments: { orderBy: { created_at: 'desc' }, take: 1 },
        transactions: { orderBy: { paid_at: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng`);
    }

    if (order.user_id !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền thao tác trên đơn hàng này',
      );
    }

    const cancellableStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.SHIPPING,
    ];

    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Không thể hủy đơn hàng ở trạng thái hiện tại: ${order.status}`,
      );
    }

    const shipment = order.shipments[0];
    if (shipment?.tracking_code) {
      const cancelled = await this.ghnService.cancelShippingOrder(
        shipment.tracking_code,
      );
      if (!cancelled) {
        throw new BadRequestException(
          'Không thể hủy vận đơn trên hệ thống vận chuyển, vui lòng thử lại sau',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.orders.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          note: reason
            ? `${order.note ? order.note + '\n' : ''}Lý do hủy: ${reason}`
            : order.note,
        },
      });

      const transaction = order.transactions[0];
      if (transaction && transaction.status === TransactionStatus.SUCCESS) {
        await tx.transactions.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.REFUNDING },
        });
      }

      return updatedOrder;
    });
  }
}
