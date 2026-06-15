// src/addresses/addresses.controller.ts (API Gateway)
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  IdDto,
  JwtPayload,
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
import { UpdateAddressDto } from '@app/common/dtos/order-fulfillment/create-address.dto';

import {
  ApiCreateAddressDocs,
  ApiGetAllAddressesDocs,
  ApiGetAddressByIdDocs,
  ApiUpdateAddressDocs,
  ApiDeleteAddressDocs,
  ApiSetDefaultAddressDocs,
} from './address.swagger';

@ApiTags('09 - Shipments')
@ApiBearerAuth('access-token')
@Controller('address')
export class AddressesController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  // POST /addresses - Tạo địa chỉ mới
  @Post()
  @ApiCreateAddressDocs()
  //   @Permissions(Permission.AddressCreate)
  async createAddress(@CurrentUser() user: JwtPayload, @Body() dto) {
    const userId: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE,
      'create_address',
      { userId, dto },
    );
  }

  // GET /addresses - Lấy tất cả địa chỉ của user hiện tại
  @Get()
  @ApiGetAllAddressesDocs()
  //   @Permissions(Permission.AddressView)
  async getAllAddresses(@CurrentUser() user: JwtPayload) {
    const userId: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_all_addresses', { userId });
  }

  // GET /addresses/:id - Lấy chi tiết địa chỉ
  @Get('/:id')
  @ApiGetAddressByIdDocs()
  // @Permissions(Permission.AddressView)
  async getAddressById(@CurrentUser() user: JwtPayload, @Param() id: UuidDto) {
    const userId: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_address_by_id', { userId, id });
  }

  // PATCH /addresses/:id - Cập nhật địa chỉ
  @Patch('/:id')
  @ApiUpdateAddressDocs()
  // @Permissions(Permission.AddressUpdate)
  async updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param() id: UuidDto,
    @Body() dto: UpdateAddressDto,
  ) {
    const userId: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'update_address', { userId, id, dto });
  }

  // DELETE /addresses/:id - Xóa địa chỉ
  @Delete('/:id')
  @ApiDeleteAddressDocs()
  // @Permissions(Permission.AddressDelete)
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param() id: UuidDto) {
    const userId: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'delete_address', { userId, id });
  }

  // PATCH /addresses/:id/set-default - Đặt làm địa chỉ mặc định
  @Patch('/:id/default')
  @ApiSetDefaultAddressDocs()
  // @Permissions(Permission.AddressUpdate)
  async setDefaultAddress(
    @CurrentUser() user: JwtPayload,
    @Param() id: UuidDto,
  ) {
    const userId: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'set_default_address', { userId, id });
  }

  // GET /address/default — chưa implement backend handler
}
