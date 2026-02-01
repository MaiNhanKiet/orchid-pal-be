import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getAllTransactions() {
    return this.prisma.transactions.findMany();
  }

  async getTransactionsByOrderId(orderId: string) {
    const transactions = await this.prisma.transactions.findFirst({
      where: {
        order_id: orderId,
      },
    });
    return transactions;
  }

  async getTransactionById(id: string) {
    const transaction = await this.prisma.transactions.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction not found`);
    }
    return transaction;
  }

  async getTransactionsByUserId(
    userId: string,
    { page, limit }: { page?: number; limit?: number },
  ) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const orders = await this.prisma.transactions.findMany({
      where: {
        user_id: userId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return orders;
  }

}
