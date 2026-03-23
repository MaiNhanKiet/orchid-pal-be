import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import { UpdateTransactionDto } from '@app/common/dtos/order-fulfillment/update-transaction.dto';
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

  async updateTransaction(id: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transactions.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction not found`);
    }
    return this.prisma.transactions.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.gateway_trans_id !== undefined && {
          gateway_trans_id: dto.gateway_trans_id,
        }),
        ...(dto.gateway_log !== undefined && { gateway_log: dto.gateway_log }),
        ...(dto.paid_at !== undefined && { paid_at: new Date(dto.paid_at) }),
      },
    });
  }

  async deleteTransaction(id: string) {
    const transaction = await this.prisma.transactions.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction not found`);
    }
    await this.prisma.transactions.delete({ where: { id } });
    return { message: 'Transaction deleted successfully' };
  }
}
