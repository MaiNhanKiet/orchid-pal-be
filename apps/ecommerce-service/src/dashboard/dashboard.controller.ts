import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @GrpcCmd('get_dashboard_summary')
  getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @GrpcCmd('get_revenue_orders')
  getRevenueOrdersTrend(@Payload() { month }: { month: string }) {
    return this.dashboardService.getRevenueOrdersTrend(month);
  }

  @GrpcCmd('get_dashboard_financial')
  getFinancialOverview(@Payload() { from, to }: { from: string; to: string }) {
    return this.dashboardService.getFinancialOverview(from, to);
  }

  @GrpcCmd('get_revenue_trend')
  getRevenueTrend(
    @Payload()
    {
      from,
      to,
      groupBy,
    }: {
      from: string;
      to: string;
      groupBy?: 'day' | 'week' | 'month';
    },
  ) {
    return this.dashboardService.getRevenueTrend(from, to, groupBy ?? 'day');
  }

  @GrpcCmd('get_revenue_method')
  getRevenueByMethod() {
    return this.dashboardService.getRevenueByMethod();
  }

  @GrpcCmd('get_cashflow')
  getCashflow() {
    return this.dashboardService.getCashflow();
  }

  @GrpcCmd('get_monthly_growth')
  getMonthlyGrowth() {
    return this.dashboardService.getMonthlyGrowth();
  }
}
