import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';

import { Payload } from '@nestjs/microservices';
import { ShipmentsService } from './shipments.service';
import { PaginationDto, UuidDto } from '@app/common';
import { UpdateShipmentDto } from '@app/common/dtos/order-fulfillment/update-shipment.dto';

@Controller()
export class ShipmentsController {
  constructor(private readonly shipmentService: ShipmentsService) {}

  @GrpcCmd('get_all_shipments')
  getAllShipments() {
    return this.shipmentService.getAllShipments();
  }

  @GrpcCmd('get_shipment_by_order_id')
  getShipmentByOrderId(
    @Payload() { id, pagination }: { id: UuidDto; pagination: PaginationDto },
  ) {
    return this.shipmentService.getShipmentsByOrderId(id.id, pagination);
  }

  @GrpcCmd('get_shipment_by_id')
  getShipmentById(@Payload() id: UuidDto) {
    return this.shipmentService.getShipmentById(id.id);
  }

  @GrpcCmd('update_shipment')
  updateShipment(
    @Payload() { id, dto }: { id: UuidDto; dto: UpdateShipmentDto },
  ) {
    return this.shipmentService.updateShipment(id.id, dto);
  }

  @GrpcCmd('delete_shipment')
  deleteShipment(@Payload() id: UuidDto) {
    return this.shipmentService.deleteShipment(id.id);
  }
}
