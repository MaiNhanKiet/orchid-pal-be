import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { UpdateOrderDto } from '@app/common/dtos/order-fulfillment/update-order.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getAllOrders() {
    return this.prisma.orders.findMany();
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
      skip: (page - 1) * limit,
      take: limit,
    });
    return orders;
  }

  async getOrderById(id: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    return order;
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

  async deleteOrder(id: string) {
    const order = await this.prisma.orders.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    await this.prisma.orders.delete({ where: { id } });
    return { message: 'Order deleted successfully' };
  }
}
