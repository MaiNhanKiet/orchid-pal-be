import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  IdDto,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UuidDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { AddDevicesToProductDto } from '@app/common/dtos/device/device.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllProductsDocs,
  ApiGetProductByIdDocs,
  ApiCreateProductDocs,
  ApiUpdateProductDocs,
  ApiDeleteProductDocs,
  ApiAddDevicesToProductDocs,
} from './product.swagger';

@ApiTags('04 - Products')
@ApiBearerAuth('access-token')
@Controller('products')
// @Public()
export class ProductsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('')
  // @Permissions(Permission.ProductView)
  @ApiGetAllProductsDocs()
  @Public()
  async getAllProducts(@Query() pagination: PaginationDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_all_products', pagination);
  }

  @Get('/:id')
  // @Permissions(Permission.ProductView)
  @ApiGetProductByIdDocs()
  @Public()
  async getProductById(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_product_by_id', id);
  }

  @Post('')
  // @Permissions(Permission.ProductCreate)
  @ApiCreateProductDocs()
  async createProduct(@Body() data: CreateProductDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'create_product', data);
  }

  @Put('/:id')
  // @Permissions(Permission.ProductUpdate)
  @ApiUpdateProductDocs()
  async updateProduct(@Param() id: UuidDto, @Body() data: UpdateProductDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'update_product', { id, data });
  }

  @Delete('/:id')
  // @Permissions(Permission.ProductDelete)
  @ApiDeleteProductDocs()
  async deleteProduct(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'delete_product', id);
  }

  @Post('/:id/devices')
  // @Permissions(Permission.ProductUpdate)
  @ApiAddDevicesToProductDocs()
  async addDevicesToProduct(
    @Param() { id }: UuidDto,
    @Body() dto: AddDevicesToProductDto,
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'add_devices_to_product', { productId: id, secretKey: dto.secretKey, quantity: dto.quantity });
  }
}
