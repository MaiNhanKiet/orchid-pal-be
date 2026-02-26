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
  ApiGetAllShipmentsDocs,
  ApiGetShipmentByIdDocs,
  ApiGetShipmentsByOrderIdDocs,
} from './shipment.swagger';

@ApiTags('Shipments')
@ApiBearerAuth('access-token')
@Controller('shipments')
@Public()
export class ShipmentsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly orderFulfillmentClient: ClientProxy,
  ) {}

  @Get('')
  @Permissions(Permission.ShipmentView)
  @ApiGetAllShipmentsDocs()
  async getAllShipments() {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'get_all_shipments' }, {}),
    );
  }

  @Get('/:id')
  @ApiGetShipmentByIdDocs()
  @Permissions(Permission.ShipmentView)
  async getShipmentById(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'get_shipment_by_id' }, id),
    );
  }

  @Get('/order/:id')
  @ApiGetShipmentsByOrderIdDocs()
  @Permissions(Permission.ShipmentView)
  async getShipmentsByOrdersId(
    @Param() id: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_shipment_by_order_id' },
        { id, pagination },
      ),
    );
  }
}
