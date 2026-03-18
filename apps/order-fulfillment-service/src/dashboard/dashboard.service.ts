import { PrismaService } from '@app/prisma';
import { Injectable } from '@nestjs/common';
import {
  TransactionStatus,
  OrderStatus,
} from '@app/common/enums/order-fulfillment.enum';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ─── 1. Dashboard Summary ────────────────────────────────────────────────
  async getDashboardSummary() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart);

    const [
      thisTx,
      lastTx,
      thisOrders,
      lastOrders,
      thisCustomers,
      lastCustomers,
      activeLicenses,
      lastLicenses,
    ] = await Promise.all([
      // Revenue this month
      this.prisma.transactions.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.SUCCESS,
          paid_at: { gte: thisMonthStart },
        },
      }),
      // Revenue last month
      this.prisma.transactions.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.SUCCESS,
          paid_at: { gte: lastMonthStart, lt: lastMonthEnd },
        },
      }),
      // Orders this month
      this.prisma.orders.count({
        where: { created_at: { gte: thisMonthStart } },
      }),
      // Orders last month
      this.prisma.orders.count({
        where: { created_at: { gte: lastMonthStart, lt: lastMonthEnd } },
      }),
      // Unique customers this month
      this.prisma.orders.groupBy({
        by: ['user_id'],
        where: { created_at: { gte: thisMonthStart } },
      }),
      // Unique customers last month
      this.prisma.orders.groupBy({
        by: ['user_id'],
        where: { created_at: { gte: lastMonthStart, lt: lastMonthEnd } },
      }),
      // Active devices (active licenses) this month
      this.prisma.devices.count({ where: { status: 'ACTIVE' } }),
      // Active devices last month
      this.prisma.devices.count({
        where: { status: 'ACTIVE', last_online_at: { lt: lastMonthEnd } },
      }),
    ]);

    const totalRevenue = Number(thisTx._sum.amount ?? 0);
    const lastRevenue = Number(lastTx._sum.amount ?? 0);
    const customers = thisCustomers.length;
    const lastCustomersCount = lastCustomers.length;

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? 0 : parseFloat((((curr - prev) / prev) * 100).toFixed(1));

    return {
      totalRevenue,
      revenueChange: pctChange(totalRevenue, lastRevenue),
      orders: thisOrders,
      ordersChange: pctChange(thisOrders, lastOrders),
      customers,
      customersChange: pctChange(customers, lastCustomersCount),
      activeLicenses,
      licensesChange: pctChange(activeLicenses, lastLicenses),
    };
  }

  // ─── 2. Revenue vs Orders Trend (by day in a month) ─────────────────────
  async getRevenueOrdersTrend(month: string) {
    // month format: YYYY-MM
    const [year, mon] = month.split('-').map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 1);

    const [transactions, orders] = await Promise.all([
      this.prisma.transactions.findMany({
        where: {
          status: TransactionStatus.SUCCESS,
          paid_at: { gte: from, lt: to },
        },
        select: { paid_at: true, amount: true },
      }),
      this.prisma.orders.findMany({
        where: { created_at: { gte: from, lt: to } },
        select: { created_at: true },
      }),
    ]);

    const revenueMap = new Map<string, number>();
    const ordersMap = new Map<string, number>();

    for (const tx of transactions) {
      const date = tx.paid_at!.toISOString().slice(0, 10);
      revenueMap.set(
        date,
        (revenueMap.get(date) ?? 0) + Number(tx.amount ?? 0),
      );
    }

    for (const o of orders) {
      const date = o.created_at!.toISOString().slice(0, 10);
      ordersMap.set(date, (ordersMap.get(date) ?? 0) + 1);
    }

    const allDates = new Set([...revenueMap.keys(), ...ordersMap.keys()]);
    const data = Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueMap.get(date) ?? 0,
        orders: ordersMap.get(date) ?? 0,
      }));

    return { data };
  }

  // ─── 3. Financial Overview ────────────────────────────────────────────────
  async getFinancialOverview(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const [paidTx, pendingTx, ordersInPeriod] = await Promise.all([
      this.prisma.transactions.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: TransactionStatus.SUCCESS,
          paid_at: { gte: fromDate, lte: toDate },
        },
      }),
      this.prisma.transactions.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.PENDING,
          paid_at: { gte: fromDate, lte: toDate },
        },
      }),
      this.prisma.orders.count({
        where: { created_at: { gte: fromDate, lte: toDate } },
      }),
    ]);

    const grossRevenue = Number(paidTx._sum.amount ?? 0);
    const orders = ordersInPeriod;
    const aov = orders > 0 ? Math.round(grossRevenue / orders) : 0;
    const pendingCash = Number(pendingTx._sum.amount ?? 0);
    // netRevenue: approximate (no separate cost table, use 90% of gross as proxy)
    const netRevenue = Math.round(grossRevenue * 0.9);

    return { grossRevenue, netRevenue, orders, aov, pendingCash };
  }

  // ─── 4. Revenue Trend ─────────────────────────────────────────────────────
  async getRevenueTrend(
    from: string,
    to: string,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.transactions.findMany({
      where: {
        status: TransactionStatus.SUCCESS,
        paid_at: { gte: fromDate, lte: toDate },
      },
      select: { paid_at: true, amount: true, order_id: true },
    });

    const orders = await this.prisma.orders.findMany({
      where: { created_at: { gte: fromDate, lte: toDate } },
      select: { created_at: true },
    });

    const keyOf = (date: Date): string => {
      const d = date.toISOString();
      if (groupBy === 'day') return d.slice(0, 10);
      if (groupBy === 'month') return d.slice(0, 7);
      // week: use Monday date
      const tmp = new Date(date);
      const day = tmp.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      tmp.setDate(tmp.getDate() + diff);
      return tmp.toISOString().slice(0, 10);
    };

    const revenueMap = new Map<string, number>();
    const ordersMap = new Map<string, number>();

    for (const tx of transactions) {
      if (!tx.paid_at) continue;
      const key = keyOf(tx.paid_at);
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(tx.amount ?? 0));
    }
    for (const o of orders) {
      if (!o.created_at) continue;
      const key = keyOf(o.created_at);
      ordersMap.set(key, (ordersMap.get(key) ?? 0) + 1);
    }

    const allKeys = new Set([...revenueMap.keys(), ...ordersMap.keys()]);
    const data = Array.from(allKeys)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueMap.get(date) ?? 0,
        orders: ordersMap.get(date) ?? 0,
      }));

    return { data };
  }

  // ─── 5. Revenue by Payment Method ─────────────────────────────────────────
  async getRevenueByMethod() {
    const grouped = await this.prisma.transactions.groupBy({
      by: ['method'],
      _sum: { amount: true },
      where: { status: TransactionStatus.SUCCESS },
    });

    const total = grouped.reduce((s, r) => s + Number(r._sum.amount ?? 0), 0);

    const data = grouped.map((r) => {
      const amount = Number(r._sum.amount ?? 0);
      return {
        method: r.method ?? 'unknown',
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    });

    return { data };
  }

  // ─── 6. Cashflow Chart ────────────────────────────────────────────────────
  async getCashflow() {
    const transactions = await this.prisma.transactions.findMany({
      where: { status: TransactionStatus.SUCCESS },
      select: { paid_at: true, amount: true },
      orderBy: { paid_at: 'asc' },
    });

    const moneyInMap = new Map<string, number>();

    for (const tx of transactions) {
      if (!tx.paid_at) continue;
      const date = tx.paid_at.toISOString().slice(0, 10);
      moneyInMap.set(
        date,
        (moneyInMap.get(date) ?? 0) + Number(tx.amount ?? 0),
      );
    }

    const data = Array.from(moneyInMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, moneyIn]) => ({
        date,
        moneyIn,
        moneyOut: 0,
        net: moneyIn,
      }));

    return { data };
  }

  // ─── 7. Monthly Growth (last 6 months) ────────────────────────────────────
  async getMonthlyGrowth() {
    const now = new Date();
    const months: { month: string; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      // Calculate month by adjusting zero-indexed month
      let targetMonth = now.getMonth() - i;
      let targetYear = now.getFullYear();
      
      // Handle negative months gracefully (wrapping to previous year)
      while (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      
      const start = new Date(targetYear, targetMonth, 1);
      const end = new Date(targetYear, targetMonth + 1, 1);
      
      // Format securely bypassing UTC ISO string shift (e.g., getting 02 instead of 03 at midnight)
      const monthLabel = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

      const agg = await this.prisma.transactions.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.SUCCESS,
          paid_at: { gte: start, lt: end },
        },
      });

      months.push({
        month: monthLabel,
        revenue: Number(agg._sum.amount ?? 0),
      });

      console.log(`Calculated growth for ${monthLabel}: $${months[months.length - 1].revenue}`);
    }

    return { data: months };
  }
}
