// src/addresses/address.service.ts
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '@app/common/dtos/order-fulfillment/create-address.dto';
import { PrismaService } from '@app/prisma';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    // Nếu set is_default = true → unset các địa chỉ default khác của user

    const isTheFirstAddress = await this.prisma.user_addresses.count({
      where: { user_id: userId },
    });

    if (isTheFirstAddress === 0) {
      dto.is_default = true;
    }

    if (dto.is_default) {
      await this.prisma.user_addresses.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
    }

    const address = await this.prisma.user_addresses.create({
      data: {
        user_id: userId,
        recipient_name: dto.recipient_name,
        phone: dto.phone,
        street: dto.street,
        ward: dto.ward,
        district: dto.district,
        city: dto.city,
        is_default: dto.is_default ?? false,
        type: dto.type,
      },
    });

    return address;
  }

  async findAll(userId: string) {
    const addresses = await this.prisma.user_addresses.findMany({
      where: { user_id: userId },
    });

    return addresses;
  }

  async findOne(userId: string, id: string) {
    const address = await this.prisma.user_addresses.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Địa chỉ không tồn tại');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập địa chỉ này');
    }

    return address;
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.user_addresses.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Địa chỉ không tồn tại');
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật địa chỉ này');
    }

    // Nếu update is_default = true → unset default khác
    if (dto.is_default === true) {
      await this.prisma.user_addresses.updateMany({
        where: { user_id: userId, is_default: true, id: { not: id } },
        data: { is_default: false },
      });
    }

    const updated = await this.prisma.user_addresses.update({
      where: { id },
      data: {
        recipient_name: dto.recipient_name,
        phone: dto.phone,
        street: dto.street,
        ward: dto.ward,
        district: dto.district,
        city: dto.city,
        is_default: dto.is_default,
        type: dto.type,
      },
    });

    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    const address = await this.prisma.user_addresses.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Địa chỉ không tồn tại');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa địa chỉ này');
    }

    await this.prisma.user_addresses.delete({ where: { id } });
  }

  async setDefault(userId: string, id: string) {
    const address = await this.prisma.user_addresses.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Địa chỉ không tồn tại');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền thay đổi địa chỉ này');
    }

    // Unset tất cả default khác
    await this.prisma.user_addresses.updateMany({
      where: { user_id: userId, is_default: true, id: { not: id } },
      data: { is_default: false },
    });

    // Set default cho cái này
    const updated = await this.prisma.user_addresses.update({
      where: { id },
      data: { is_default: true },
    });

    return updated;
  }
}
