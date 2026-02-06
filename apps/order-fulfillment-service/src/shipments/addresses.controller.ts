// src/addresses/addresses.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddressService } from './address.service';

import { UuidDto, PaginationDto } from '@app/common'; // giả sử bạn đã có các DTO chung
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '@app/common/dtos/order-fulfillment/create-address.dto';

@Controller()
export class AddressesController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * Tạo địa chỉ mới cho user hiện tại
   * Pattern: { cmd: 'create_address' }
   * Payload: { userId: string, dto: CreateAddressDto }
   */
  @MessagePattern({ cmd: 'create_address' })
  async createAddress(
    @Payload() payload: { userId: string; dto: CreateAddressDto },
  ) {
    return this.addressService.create(payload.userId, payload.dto);
  }

  /**
   * Lấy tất cả địa chỉ của user hiện tại
   * Pattern: { cmd: 'get_all_addresses' }
   * Payload: { userId: string, pagination?: PaginationDto }
   */
  @MessagePattern({ cmd: 'get_all_addresses' })
  async getAllAddresses(@Payload() payload: { userId: string }) {
    return this.addressService.findAll(payload.userId);
  }

  /**
   * Lấy chi tiết một địa chỉ theo ID
   * Pattern: { cmd: 'get_address_by_id' }
   * Payload: { userId: string, id: string }
   */
  @MessagePattern({ cmd: 'get_address_by_id' })
  async getAddressById(@Payload() payload: { userId: string; id: string }) {
    return this.addressService.findOne(payload.userId, payload.id);
  }

  /**
   * Cập nhật địa chỉ
   * Pattern: { cmd: 'update_address' }
   * Payload: { userId: string, id: string, dto: UpdateAddressDto }
   */
  @MessagePattern({ cmd: 'update_address' })
  async updateAddress(
    @Payload() payload: { userId: string; id: string; dto: UpdateAddressDto },
  ) {
    return this.addressService.update(payload.userId, payload.id, payload.dto);
  }

  /**
   * Xóa địa chỉ
   * Pattern: { cmd: 'delete_address' }
   * Payload: { userId: string, id: string }
   */
  @MessagePattern({ cmd: 'delete_address' })
  async deleteAddress(@Payload() payload: { userId: string; id: string }) {
    return this.addressService.delete(payload.userId, payload.id);
  }

  /**
   * Đặt địa chỉ làm mặc định
   * Pattern: { cmd: 'set_default_address' }
   * Payload: { userId: string, id: string }
   */
  @MessagePattern({ cmd: 'set_default_address' })
  async setDefaultAddress(@Payload() payload: { userId: string; id: string }) {
    return this.addressService.setDefault(payload.userId, payload.id);
  }
}
