import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICES_CLIENTS, Public } from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import {
  ApiGetDashboardSummaryDocs,
  ApiGetRevenueOrdersDocs,
  ApiGetFinancialOverviewDocs,
  ApiGetRevenueTrendDocs,
  ApiGetRevenueMethodDocs,
  ApiGetCashflowDocs,
  ApiGetMonthlyGrowthDocs,
} from './dashboard.swagger';

@ApiTags('10 - Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@Public()
export class DashboardController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  // 1. Dashboard Summary
  @Get('summary')
  @ApiGetDashboardSummaryDocs()
  getDashboardSummary() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_dashboard_summary', {});
  }

  // 2. Revenue vs Orders Trend
  @Get('revenue-orders')
  @ApiGetRevenueOrdersDocs()
  getRevenueOrders(@Query('month') month: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_revenue_orders', { month });
  }

  // 3. Financial Overview
  @Get('financial')
  @ApiGetFinancialOverviewDocs()
  getFinancialOverview(@Query('from') from: string, @Query('to') to: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_dashboard_financial', { from, to });
  }

  // 4. Revenue Trend
  @Get('revenue-trend')
  @ApiGetRevenueTrendDocs()
  getRevenueTrend(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_revenue_trend', { from, to, groupBy: groupBy ?? 'day' });
  }

  // 5. Revenue by Payment Method
  @Get('revenue-method')
  @ApiGetRevenueMethodDocs()
  getRevenueMethod() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_revenue_method', {});
  }

  // 6. Cashflow Chart
  @Get('cashflow')
  @ApiGetCashflowDocs()
  getCashflow() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_cashflow', {});
  }

  // 7. Monthly Growth (last 6 months)
  @Get('monthly-growth')
  @ApiGetMonthlyGrowthDocs()
  getMonthlyGrowth() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_monthly_growth', {});
  }
}
