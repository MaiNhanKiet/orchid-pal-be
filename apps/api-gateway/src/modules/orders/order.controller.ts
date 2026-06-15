import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  UuidDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllOrdersDocs,
  ApiGetOrderByIdDocs,
  ApiGetOrdersByUserIdDocs,
  ApiGetOrdersOfUserDocs,
  ApiUpdateOrderDocs,
  ApiDeleteOrderDocs,
  ApiBulkUpdateOrderStatusDocs,
  ApiCancelOrderDocs,
} from './order.swagger';
import { UpdateOrderDto } from '@app/common/dtos/order-fulfillment/update-order.dto';

@ApiTags('06 - Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('')
  // @Permissions(Permission.OrderViewAll)
  @ApiGetAllOrdersDocs()
  async getAllOrders() {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_all_orders', {});
  }

  @Get('/:id')
  // @Permissions(Permission.OrderView)
  @ApiGetOrderByIdDocs()
  async getOrderById(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_order_by_id', id);
  }

  @Get('/user/:id')
  @ApiGetOrdersByUserIdDocs()
  // @Permissions(Permission.OrderView)
  async getOrdersByUserId(
    @Param() userId: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_orders_by_user_id', { userId, pagination });
  }

  @Get('/user')
  @ApiGetOrdersOfUserDocs()
  // @Permissions(Permission.OrderView)
  async getOrdersOfUser(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const userId: UuidDto = { id: user.sub };
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_orders_by_user_id', { userId, pagination });
  }

  @Put('/:id/status')
  @ApiUpdateOrderDocs()
  async updateOrderStatus(
    @Param() id: UuidDto,
    @Body() body: { status: string },
  ) {
    return await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE,
      'update_order_status',
      { id, status: body.status },
    );
  }

  @Put('/:id')
  @ApiUpdateOrderDocs()
  // @Permissions(Permission.OrderUpdate)
  async updateOrder(@Param() id: UuidDto, @Body() dto: UpdateOrderDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'update_order', { id, dto });
  }

  @Put('/bulk/status')
  @ApiBulkUpdateOrderStatusDocs()
  // @Permissions(Permission.OrderUpdate)
  async bulkUpdateOrderStatus(
    @Body() body: { orderIds: string[]; status: string },
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'bulk_update_order_status', body);
  }

  @Delete('/:id')
  @ApiDeleteOrderDocs()
  // @Permissions(Permission.OrderDelete)
  async deleteOrder(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'delete_order', id);
  }

  @Post('/:id/cancel')
  @ApiCancelOrderDocs()
  async cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param() id: UuidDto,
    @Body() body: { reason?: string },
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'cancel_order', { userId: user.sub, id: id.id, reason: body.reason });
  }
}
