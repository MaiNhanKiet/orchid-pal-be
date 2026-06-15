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
    return this.prisma.transactions.findMany({
      include: {
        users: { select: { id: true, full_name: true, email: true } },
        orders: {
          select: { order_code: true, total_amount: true, status: true },
        },
      },
    });
  }

  async getTransactionsByOrderId(orderId: string) {
    const transactions = await this.prisma.transactions.findFirst({
      where: {
        order_id: orderId,
      },
      include: {
        users: { select: { id: true, full_name: true, email: true } },
        orders: {
          select: { order_code: true, total_amount: true, status: true },
        },
      },
    });
    return transactions;
  }

  async getTransactionById(id: string) {
    const transaction = await this.prisma.transactions.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, full_name: true, email: true } },
        orders: {
          select: { order_code: true, total_amount: true, status: true },
        },
      },
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
      include: {
        users: { select: { id: true, full_name: true, email: true } },
        orders: {
          select: { order_code: true, total_amount: true, status: true },
        },
      },
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

  async getTransactionOverview() {
    const grossRevenue = await this.prisma.transactions.aggregate({
      where: {
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    });

    const averageRevenuePerTransaction = await this.prisma.transactions.aggregate({
      where: {
        status: 'SUCCESS',
      },
      _avg: {
        amount: true,
      },
    });

    const refunded = await this.prisma.transactions.aggregate({
      where: {
        status: 'REFUNDED',
      },
      _sum: {
        amount: true,
      },
    });
    const netRevenue = {
      _sum: {
        amount: (grossRevenue?._sum?.amount?.toNumber() || 0) - (refunded?._sum?.amount?.toNumber() || 0),
      },
    };

    const averageNetRevenuePerTransaction = {
      _avg: {
        amount: (averageRevenuePerTransaction?._avg?.amount?.toNumber() || 0) - (refunded?._sum?.amount?.toNumber() || 0) / (grossRevenue?._sum?.amount?.toNumber() || 1),
      },
    };

    const pendingCod = await this.prisma.transactions.aggregate({
      where: {
        method: 'COD',
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    const payOSRevenue = await this.prisma.transactions.aggregate({
      where: {
        method: 'PAYOS',
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    });

    const codRevenue = await this.prisma.transactions.aggregate({
      where: {
        method: 'COD',
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      grossRevenue: grossRevenue?._sum?.amount?.toNumber() || 0,
      netRevenue: netRevenue._sum?.amount || 0,
      pendingCod: pendingCod?._sum?.amount?.toNumber() || 0,
      averageRevenuePerTransaction: averageRevenuePerTransaction?._avg?.amount?.toNumber() || 0,
      averageNetRevenuePerTransaction: averageNetRevenuePerTransaction._avg?.amount || 0,
      // refunded: refunded?._sum?.amount?.toNumber() || 0,
      payOSRevenue: payOSRevenue?._sum?.amount?.toNumber() || 0,
      codRevenue: codRevenue?._sum?.amount?.toNumber() || 0,
    };
  }
}
