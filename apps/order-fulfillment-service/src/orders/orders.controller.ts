import { Controller } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { PaginationDto } from '@app/common/dtos/pagination.dto';
import { UuidDto } from '@app/common';
import { UpdateOrderDto } from '@app/common/dtos/order-fulfillment/update-order.dto';

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

  @MessagePattern({ cmd: 'update_order' })
  updateOrder(@Payload() { id, dto }: { id: UuidDto; dto: UpdateOrderDto }) {
    return this.orderService.updateOrder(id.id, dto);
  }

  @MessagePattern({ cmd: 'bulk_update_order_status' })
  bulkUpdateOrderStatus(
    @Payload() { orderIds, status }: { orderIds: string[]; status: string },
  ) {
    return this.orderService.bulkUpdateOrderStatus(orderIds, status);
  }

  @MessagePattern({ cmd: 'delete_order' })
  deleteOrder(@Payload() id: UuidDto) {
    return this.orderService.deleteOrder(id.id);
  }

  @MessagePattern({ cmd: 'cancel_order' })
  cancelOrder(
    @Payload()
    { userId, id, reason }: { userId: string; id: string; reason?: string },
  ) {
    return this.orderService.cancelOrder(userId, id, reason);
  }
}
