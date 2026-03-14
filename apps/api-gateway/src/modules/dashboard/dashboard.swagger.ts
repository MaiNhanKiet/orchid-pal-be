import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

// ─── 1. Summary ───────────────────────────────────────────────────────────────
export function ApiGetDashboardSummaryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Dashboard summary – KPI tổng quan so với tháng trước' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Tổng quan dashboard',
      schema: {
        example: {
          totalRevenue: 45231.89,
          revenueChange: 20.1,
          orders: 2350,
          ordersChange: 15.2,
          customers: 1289,
          customersChange: 8.4,
          activeLicenses: 573,
          licensesChange: -2.3,
        },
      },
    }),
  );
}

// ─── 2. Revenue vs Orders Trend ───────────────────────────────────────────────
export function ApiGetRevenueOrdersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Revenue vs Orders Trend theo ngày trong tháng' }),
    ApiAuthFailures(),
    ApiQuery({
      name: 'month',
      required: true,
      type: 'string',
      example: '2026-03',
      description: 'Tháng cần lấy dữ liệu, format YYYY-MM',
    }),
    ApiResponse({
      status: 200,
      description: 'Dữ liệu revenue và orders theo ngày',
      schema: {
        example: {
          data: [
            { date: '2026-03-01', revenue: 2600, orders: 62 },
            { date: '2026-03-02', revenue: 1800, orders: 45 },
          ],
        },
      },
    }),
  );
}

// ─── 3. Financial Overview ────────────────────────────────────────────────────
export function ApiGetFinancialOverviewDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Financial Overview trong khoảng thời gian' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'from', required: true, type: 'string', example: '2026-04-01' }),
    ApiQuery({ name: 'to', required: true, type: 'string', example: '2026-04-12' }),
    ApiResponse({
      status: 200,
      description: 'Tổng quan tài chính',
      schema: {
        example: {
          grossRevenue: 64215581,
          netRevenue: 48348240,
          orders: 82,
          aov: 2150000,
          pendingCash: 4500000,
        },
      },
    }),
  );
}

// ─── 4. Revenue Trend ─────────────────────────────────────────────────────────
export function ApiGetRevenueTrendDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Chart Revenue Trend theo ngày/tuần/tháng' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'from', required: true, type: 'string', example: '2026-04-01' }),
    ApiQuery({ name: 'to', required: true, type: 'string', example: '2026-04-12' }),
    ApiQuery({
      name: 'groupBy',
      required: false,
      enum: ['day', 'week', 'month'],
      example: 'day',
    }),
    ApiResponse({
      status: 200,
      description: 'Revenue trend data',
      schema: {
        example: {
          data: [
            { date: '2026-04-01', revenue: 3200000, orders: 14 },
            { date: '2026-04-02', revenue: 2800000, orders: 11 },
          ],
        },
      },
    }),
  );
}

// ─── 5. Revenue by Payment Method ─────────────────────────────────────────────
export function ApiGetRevenueMethodDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Revenue by payment method' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Doanh thu theo phương thức thanh toán',
      schema: {
        example: {
          data: [
            { method: 'vietqr', amount: 39540667, percent: 66 },
            { method: 'cod', amount: 20402667, percent: 34 },
          ],
        },
      },
    }),
  );
}

// ─── 6. Cashflow Chart ────────────────────────────────────────────────────────
export function ApiGetCashflowDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cashflow chart theo ngày' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cashflow dữ liệu',
      schema: {
        example: {
          data: [
            { date: '2026-03-01', moneyIn: 5200000, moneyOut: 1400000, net: 3800000 },
            { date: '2026-03-02', moneyIn: 5800000, moneyOut: 1500000, net: 4300000 },
          ],
        },
      },
    }),
  );
}

// ─── 7. Monthly Growth ────────────────────────────────────────────────────────
export function ApiGetMonthlyGrowthDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Monthly growth – 6 tháng gần nhất' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Doanh thu theo tháng (6 tháng gần nhất)',
      schema: {
        example: {
          data: [
            { month: '2025-09', revenue: 18000 },
            { month: '2025-10', revenue: 22000 },
            { month: '2025-11', revenue: 26000 },
          ],
        },
      },
    }),
  );
}
