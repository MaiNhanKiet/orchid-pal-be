import { Controller } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShipmentsService } from './shipments.service';
import { PaginationDto, UuidDto } from '@app/common';

@Controller()
export class ShipmentsController {
  constructor(private readonly shipmentService: ShipmentsService) {}

  @MessagePattern({ cmd: 'get_all_shipments' })
  getAllShipments() {
    return this.shipmentService.getAllShipments();
  }

  @MessagePattern({ cmd: 'get_shipment_by_order_id' })
  getShipmentByOrderId(@Payload() { id, pagination }: { id: UuidDto; pagination: PaginationDto }) {
    return this.shipmentService.getShipmentsByOrderId(id.id, pagination);
  }

  @MessagePattern({ cmd: 'get_shipment_by_id' })
  getShipmentById(@Payload() id: UuidDto) {
    return this.shipmentService.getShipmentById(id.id);
  }
}
