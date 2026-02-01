import { Controller } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { ShipmentsService } from './shipments.service';

@Controller()
export class ShipmentsController {
  constructor(private readonly shipmentService: ShipmentsService) {}

  @MessagePattern('get_all_shipments')
  getAllShipments() {
    return this.shipmentService.getAllShipments();
  }

  @MessagePattern('get_shipment_by_order_id')
  getShipmentByOrderId(
    orderId: string,
    { page, limit }: { page?: number; limit?: number },
  ) {
    return this.shipmentService.getShipmentsByOrderId(orderId, { page, limit });
  }

  @MessagePattern('get_shipment_by_id')
  getShipmentById(id: string) {
    return this.shipmentService.getShipmentById(id);
  }
}
