import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import { UpdateShipmentDto } from '@app/common/dtos/order-fulfillment/update-shipment.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GhnService } from './ghn.service';

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private ghnService: GhnService,
  ) {}

  async getAllShipments() {
    return this.prisma.shipments.findMany();
  }

  async getShipmentsByOrderId(
    orderId: string,
    { page, limit }: { page?: number; limit?: number },
  ) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const shipments = await this.prisma.shipments.findMany({
      where: {
        order_id: orderId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return shipments;
  }

  async getShipmentById(id: string) {
    const shipment = await this.prisma.shipments.findUnique({
      where: { id },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment not found`);
    }

    let ghn_status = null;
    if (shipment.tracking_code) {
      ghn_status = await this.ghnService.getOrderStatus(shipment.tracking_code);
    }

    return {
      ...shipment,
      ghn_status,
    };
  }

  async updateShipment(id: string, dto: UpdateShipmentDto) {
    const shipment = await this.prisma.shipments.findUnique({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment not found`);
    }
    return this.prisma.shipments.update({
      where: { id },
      data: {
        ...(dto.carrier_name !== undefined && {
          carrier_name: dto.carrier_name,
        }),
        ...(dto.tracking_code !== undefined && {
          tracking_code: dto.tracking_code,
        }),
        ...(dto.shipping_fee !== undefined && {
          shipping_fee: dto.shipping_fee,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.estimated_delivery_at !== undefined && {
          estimated_delivery_at: new Date(dto.estimated_delivery_at),
        }),
      },
    });
  }

  async deleteShipment(id: string) {
    const shipment = await this.prisma.shipments.findUnique({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment not found`);
    }
    await this.prisma.shipments.delete({ where: { id } });
    return { message: 'Shipment deleted successfully' };
  }
}
