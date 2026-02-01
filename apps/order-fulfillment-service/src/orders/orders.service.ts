import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
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
}
