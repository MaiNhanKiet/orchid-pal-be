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
  Req,
} from '@nestjs/common';
import {
  IdDto,
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
} from './order.swagger';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
// @Public()
export class OrdersController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get('')
  @Permissions(Permission.OrderViewAll)
  @ApiGetAllOrdersDocs()
  async getAllOrders() {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_orders' }, {}),
    );
  }

  @Get('/:id')
  @Permissions(Permission.OrderView)
  @ApiGetOrderByIdDocs()
  async getOrderById(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_order_by_id' }, id),
    );
  }

  @Get('/user/:id')
  @ApiGetOrdersByUserIdDocs()
  @Permissions(Permission.OrderView)
  async getOrdersByUserId(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_orders_by_user_id' }, id),
    );
  }

  @Get('/user')
  @ApiGetOrdersByUserIdDocs()
  @Permissions(Permission.OrderView)
  async getOrdersOfUser(@Req() req) {
    const userId = req.user;
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_orders_by_user_id' }, userId),
    );
  }

  @Post('/check-out')
  // @Permissions(Permission.OrderCreate)
  async checkOut(@Req() req, @Body() checkOutDto: CheckoutDto) {
    const id = {
      id: req.user.sub,
      ...req.user
    };
    console.log("User: ", id);
    
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'check_out' }, {id, checkOutDto}),
    );
  }

  
}
