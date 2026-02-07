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
  Req,
} from '@nestjs/common';
import {
  IdDto,
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

// Giả sử bạn sẽ tạo các decorator Swagger riêng (tương tự shipments)
// Nếu chưa có thì tạm để trống hoặc tự thêm

@ApiTags('Addresses')
@ApiBearerAuth('access-token')
@Controller('addresses')
export class AddressesController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly addressClient: ClientProxy,
  ) {}

  // POST /addresses - Tạo địa chỉ mới
  @Post()
  //   @Permissions(Permission.AddressCreate)
  async createAddress(@Req() req: any, @Body() dto: any) {
    const userId = req.user.sub; // Lấy user ID từ sub trong JWT

    return await firstValueFrom(
      this.addressClient.send(
        { cmd: 'create_address' },
        { userId, dto }, // Payload đúng format microservice mong đợi
      ),
    );
  }

  // GET /addresses - Lấy tất cả địa chỉ của user hiện tại
  @Get()
  //   @Permissions(Permission.AddressView)
  async getAllAddresses(@Req() req: any, @Query() pagination?: PaginationDto) {
    const userId = req.user.sub;

    return await firstValueFrom(
      this.addressClient.send(
        { cmd: 'get_all_addresses' },
        { userId, pagination },
      ),
    );
  }

  // GET /addresses/:id - Lấy chi tiết địa chỉ
  @Get('/:id')
  @Permissions(Permission.AddressView)
  async getAddressById(@Req() req: any, @Param() params: UuidDto) {
    const userId = req.user.sub;

    return await firstValueFrom(
      this.addressClient.send(
        { cmd: 'get_address_by_id' },
        { userId, id: params.id },
      ),
    );
  }

  // PATCH /addresses/:id - Cập nhật địa chỉ
  @Patch('/:id')
  @Permissions(Permission.AddressUpdate)
  async updateAddress(
    @Req() req: any,
    @Param() params: UuidDto,
    @Body() dto: any,
  ) {
    const userId = req.user.sub;

    return await firstValueFrom(
      this.addressClient.send(
        { cmd: 'update_address' },
        { userId, id: params.id, dto },
      ),
    );
  }

  // DELETE /addresses/:id - Xóa địa chỉ
  @Delete('/:id')
  @Permissions(Permission.AddressDelete)
  async deleteAddress(@Req() req: any, @Param() params: UuidDto) {
    const userId = req.user.sub;

    return await firstValueFrom(
      this.addressClient.send(
        { cmd: 'delete_address' },
        { userId, id: params.id },
      ),
    );
  }

  // PATCH /addresses/:id/set-default - Đặt làm địa chỉ mặc định
  @Patch('/:id/set-default')
  @Permissions(Permission.AddressUpdate)
  async setDefaultAddress(@Req() req: any, @Param() params: UuidDto) {
    const userId = req.user.sub;

    return await firstValueFrom(
      this.addressClient.send(
        { cmd: 'set_default_address' },
        { userId, id: params.id },
      ),
    );
  }

  // GET /addresses/default - Lấy địa chỉ mặc định của user
  @Get('default')
  @Permissions(Permission.AddressView)
  async getDefaultAddress(@Req() req: any) {
    const userId = req.user.sub;

    return await firstValueFrom(
      this.addressClient.send({ cmd: 'get_default_address' }, { userId }),
    );
  }
}
