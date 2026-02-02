import { Controller } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { PaginationDto } from '@app/common/dtos/pagination.dto';
import { UuidDto } from '@app/common';

@Controller()
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @MessagePattern({ cmd: 'get_all_orders' })
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @MessagePattern({ cmd: 'get_orders_by_user_id' })
  getOrdersByUserId(
    @Payload()
    { userId, pagination }: { userId: UuidDto; pagination: PaginationDto },
  ) {
    return this.orderService.getOrdersByUserId(userId.id, pagination);
  }

  @MessagePattern({ cmd: 'get_order_by_id' })
  getOrderById(@Payload() id: UuidDto) {
    return this.orderService.getOrderById(id.id);
  }
}
