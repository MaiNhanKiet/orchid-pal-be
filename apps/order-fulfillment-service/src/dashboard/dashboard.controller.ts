import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @MessagePattern({ cmd: 'get_dashboard_summary' })
  getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @MessagePattern({ cmd: 'get_revenue_orders' })
  getRevenueOrdersTrend(@Payload() { month }: { month: string }) {
    return this.dashboardService.getRevenueOrdersTrend(month);
  }

  @MessagePattern({ cmd: 'get_dashboard_financial' })
  getFinancialOverview(@Payload() { from, to }: { from: string; to: string }) {
    return this.dashboardService.getFinancialOverview(from, to);
  }

  @MessagePattern({ cmd: 'get_revenue_trend' })
  getRevenueTrend(
    @Payload() { from, to, groupBy }: { from: string; to: string; groupBy?: 'day' | 'week' | 'month' },
  ) {
    return this.dashboardService.getRevenueTrend(from, to, groupBy ?? 'day');
  }

  @MessagePattern({ cmd: 'get_revenue_method' })
  getRevenueByMethod() {
    return this.dashboardService.getRevenueByMethod();
  }

  @MessagePattern({ cmd: 'get_cashflow' })
  getCashflow() {
    return this.dashboardService.getCashflow();
  }

  @MessagePattern({ cmd: 'get_monthly_growth' })
  getMonthlyGrowth() {
    return this.dashboardService.getMonthlyGrowth();
  }
}
