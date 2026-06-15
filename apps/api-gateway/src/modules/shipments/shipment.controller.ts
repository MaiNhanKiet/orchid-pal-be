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
import { GrpcRpcService } from '@app/grpc';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllShipmentsDocs,
  ApiGetShipmentByIdDocs,
  ApiGetShipmentsByOrderIdDocs,
  ApiUpdateShipmentDocs,
  ApiDeleteShipmentDocs,
} from './shipment.swagger';
import { UpdateShipmentDto } from '@app/common/dtos/order-fulfillment/update-shipment.dto';

@ApiTags('09 - Shipments')
@ApiBearerAuth('access-token')
@Controller('shipments')
// @Public()
export class ShipmentsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('')
  // @Permissions(Permission.ShipmentView)
  @ApiGetAllShipmentsDocs()
  async getAllShipments() {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_all_shipments', {});
  }

  @Get('/:id')
  @ApiGetShipmentByIdDocs()
  // @Permissions(Permission.ShipmentView)
  async getShipmentById(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_shipment_by_id', id);
  }

  @Get('/order/:id')
  @ApiGetShipmentsByOrderIdDocs()
  // @Permissions(Permission.ShipmentView)
  async getShipmentsByOrdersId(
    @Param() id: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_shipment_by_order_id', { id, pagination });
  }

  @Put('/:id')
  @ApiUpdateShipmentDocs()
  // @Permissions(Permission.ShipmentUpdate)
  async updateShipment(@Param() id: UuidDto, @Body() dto: UpdateShipmentDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'update_shipment', { id, dto });
  }

  @Delete('/:id')
  @ApiDeleteShipmentDocs()
  // @Permissions(Permission.ShipmentDelete)
  async deleteShipment(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'delete_shipment', id);
  }
}
