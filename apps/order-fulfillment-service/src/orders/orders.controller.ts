import { Controller } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @MessagePattern('get_all_orders')
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @MessagePattern('get_orders_by_user_id')
  getOrdersByUserId({
    userId,
    page,
    limit,
  }: {
    userId: string;
    page?: number;
    limit?: number;
  }) {
    return this.orderService.getOrdersByUserId(userId, { page, limit });
  }

  @MessagePattern('get_order_by_id')
  getOrderById(id: string) {
    return this.orderService.getOrderById(id);
  }
}
