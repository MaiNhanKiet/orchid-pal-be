import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  IdDto,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UuidDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllOrdersDocs,
  ApiGetOrderByIdDocs,
  ApiGetOrdersByUserIdDocs,
  ApiGetOrdersOfUserDocs,
} from './order.swagger';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@Public()
export class OrdersController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly orderFulfillmentClient: ClientProxy,
  ) {}

  @Get('')
  @Permissions(Permission.OrderViewAll)
  @ApiGetAllOrdersDocs()
  async getAllOrders() {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'get_all_orders' }, {}),
    );
  }

  @Get('/:id')
  @Permissions(Permission.OrderView)
  @ApiGetOrderByIdDocs()
  async getOrderById(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'get_order_by_id' }, id),
    );
  }

  @Get('/user/:id')
  @ApiGetOrdersByUserIdDocs()
  @Permissions(Permission.OrderView)
  async getOrdersByUserId(
    @Param() userId: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_orders_by_user_id' },
        { userId, pagination },
      ),
    );
  }

  @Get('/user')
  @ApiGetOrdersOfUserDocs()
  @Permissions(Permission.OrderView)
  async getOrdersOfUser(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const userId: UuidDto = { id: user.sub };
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_orders_by_user_id' },
        { userId, pagination },
      ),
    );
  }
}
