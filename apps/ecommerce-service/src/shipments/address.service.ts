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

  private async calculateShippingFee(
    to_district_id: number,
    to_ward_code: string,
  ): Promise<number | null> {
    try {
      const url = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee";
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Token: process.env.GHN_TOKEN,
          ShopId: process.env.GHN_SHOP_ID,
        },
        body: JSON.stringify({
          to_district_id,
          to_ward_code,
          weight: 1000,
          service_type_id: 2,
        }),
      });

      const data = await response.json();
      if (data.code === 200 && data.data) {
        return data.data.total;
      }
      return null;
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      return null;
    }
  }

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

    let shipping_fee = 0;
    if (dto.ghn_district_id && dto.ghn_ward_code) {
      shipping_fee =
        (await this.calculateShippingFee(
          dto.ghn_district_id,
          dto.ghn_ward_code,
        )) || 0;
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
        ghn_district_id: dto.ghn_district_id,
        ghn_ward_code: dto.ghn_ward_code,
        shipping_fee: shipping_fee,
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

    let shipping_fee = existing.shipping_fee;
    const newDistrictId =
      dto.ghn_district_id !== undefined
        ? dto.ghn_district_id
        : existing.ghn_district_id;
    const newWardCode =
      dto.ghn_ward_code !== undefined
        ? dto.ghn_ward_code
        : existing.ghn_ward_code;

    if (
      newDistrictId &&
      newWardCode &&
      (newDistrictId !== existing.ghn_district_id ||
        newWardCode !== existing.ghn_ward_code)
    ) {
      const fee = await this.calculateShippingFee(newDistrictId, newWardCode);
      if (fee !== null) {
        shipping_fee = fee;
      }
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
        ghn_district_id: dto.ghn_district_id,
        ghn_ward_code: dto.ghn_ward_code,
        shipping_fee: shipping_fee,
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
