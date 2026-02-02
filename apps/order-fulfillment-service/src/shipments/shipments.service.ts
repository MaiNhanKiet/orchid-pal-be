import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

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
    return shipment;
  }
}
