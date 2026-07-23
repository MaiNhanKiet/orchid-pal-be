import {
  Body,
  Controller,
  Delete,
  Get,
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
  Public,
  UuidDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { Permission } from '@app/common/enums';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { ProvisionDevicesDto } from '@app/common/dtos/device/device.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiCreateProductDocs,
  ApiDeleteProductDocs,
  ApiGetAllProductsDocs,
  ApiGetProductByIdDocs,
  ApiProvisionDevicesDocs,
  ApiUpdateProductDocs,
} from './product.swagger';

@ApiTags('04 - Products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  @Public()
  @ApiGetAllProductsDocs()
  getAllProducts(@Query() pagination: PaginationDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'get_all_products',
      pagination,
    );
  }

  @Get(':id')
  @Public()
  @ApiGetProductByIdDocs()
  getProductById(@Param() id: UuidDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'get_product_by_id',
      id,
    );
  }

  @Post()
  @Permissions(Permission.ProductCreate)
  @ApiCreateProductDocs()
  createProduct(@Body() data: CreateProductDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'create_product', data);
  }

  @Put(':id')
  @Permissions(Permission.ProductUpdate)
  @ApiUpdateProductDocs()
  updateProduct(@Param() id: UuidDto, @Body() data: UpdateProductDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'update_product', {
      id,
      data,
    });
  }

  @Delete(':id')
  @Permissions(Permission.ProductDelete)
  @ApiDeleteProductDocs()
  deleteProduct(@Param() id: UuidDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'delete_product', id);
  }

  @Post('provision-devices')
  @Permissions(Permission.DeviceProvision)
  @ApiProvisionDevicesDocs()
  provisionDevices(@Body() dto: ProvisionDevicesDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'provision_devices',
      dto,
    );
  }
}
