import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';

import { Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { PaginationDto } from '@app/common/dtos/pagination.dto';
import { UuidDto } from '@app/common';
import { UpdateOrderDto } from '@app/common/dtos/order-fulfillment/update-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @GrpcCmd('get_all_orders')
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @GrpcCmd('get_orders_by_user_id')
  getOrdersByUserId(
    @Payload()
    { userId, pagination }: { userId: UuidDto; pagination: PaginationDto },
  ) {
    return this.orderService.getOrdersByUserId(userId.id, pagination);
  }

  @GrpcCmd('get_order_by_id')
  getOrderById(@Payload() id: UuidDto) {
    return this.orderService.getOrderById(id.id);
  }

  @GrpcCmd('update_order')
  updateOrder(@Payload() { id, dto }: { id: UuidDto; dto: UpdateOrderDto }) {
    return this.orderService.updateOrder(id.id, dto);
  }

  @GrpcCmd('update_order_status')
  updateOrderStatus(
    @Payload() { id, status }: { id: UuidDto; status: string },
  ) {
    return this.orderService.updateOrder(id.id, { status } as UpdateOrderDto);
  }

  @GrpcCmd('bulk_update_order_status')
  bulkUpdateOrderStatus(
    @Payload() { orderIds, status }: { orderIds: string[]; status: string },
  ) {
    return this.orderService.bulkUpdateOrderStatus(orderIds, status);
  }

  @GrpcCmd('delete_order')
  deleteOrder(@Payload() id: UuidDto) {
    return this.orderService.deleteOrder(id.id);
  }

  @GrpcCmd('cancel_order')
  cancelOrder(
    @Payload()
    { userId, id, reason }: { userId: string; id: string; reason?: string },
  ) {
    return this.orderService.cancelOrder(userId, id, reason);
  }
}
