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

@ApiTags('Addresses')
@ApiBearerAuth('access-token')
@Controller('addresses')
export class AddressesController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly orderFulfillmentClient: ClientProxy,
  ) {}

  // POST /addresses - Tạo địa chỉ mới
  @Post()
  @ApiCreateAddressDocs()
  //   @Permissions(Permission.AddressCreate)
  async createAddress(@CurrentUser() user: JwtPayload, @Body() dto) {
    const userId: UuidDto = { id: user.sub };

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'create_address' },
        { userId, dto }, // Payload đúng format microservice mong đợi
      ),
    );
  }

  // GET /addresses - Lấy tất cả địa chỉ của user hiện tại
  @Get()
  @ApiGetAllAddressesDocs()
  //   @Permissions(Permission.AddressView)
  async getAllAddresses(@CurrentUser() user: JwtPayload) {
    const userId: UuidDto = { id: user.sub };

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_all_addresses' },
        { userId },
      ),
    );
  }

  // GET /addresses/:id - Lấy chi tiết địa chỉ
  @Get('/:id')
  @ApiGetAddressByIdDocs()
  // @Permissions(Permission.AddressView)
  async getAddressById(@CurrentUser() user: JwtPayload, @Param() id: UuidDto) {
    const userId: UuidDto = { id: user.sub };

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_address_by_id' },
        { userId, id },
      ),
    );
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

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'update_address' },
        { userId, id, dto },
      ),
    );
  }

  // DELETE /addresses/:id - Xóa địa chỉ
  @Delete('/:id')
  @ApiDeleteAddressDocs()
  // @Permissions(Permission.AddressDelete)
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param() id: UuidDto) {
    const userId: UuidDto = { id: user.sub };

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'delete_address' },
        { userId, id },
      ),
    );
  }

  // PATCH /addresses/:id/set-default - Đặt làm địa chỉ mặc định
  @Patch('/:id/set-default')
  @ApiSetDefaultAddressDocs()
  // @Permissions(Permission.AddressUpdate)
  async setDefaultAddress(
    @CurrentUser() user: JwtPayload,
    @Param() id: UuidDto,
  ) {
    const userId: UuidDto = { id: user.sub };

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'set_default_address' },
        { userId, id },
      ),
    );
  }

  // GET /addresses/default - Lấy địa chỉ mặc định của user
  // @Get('default')
  // @Permissions(Permission.AddressView)
  // async getDefaultAddress(@Req() req: any) {
  //   const userId = req.user.sub;

  //   return await firstValueFrom(
  //     this.orderFulfillmentClient.send({ cmd: 'get_default_address' }, { userId }),
  //   );
  // }
}
