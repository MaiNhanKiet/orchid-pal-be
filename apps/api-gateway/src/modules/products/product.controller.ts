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
import { IdDto, MICROSERVICES_CLIENTS, PaginationDto, Permissions, UuidDto } from '@app/common';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import { CreateProductDto, UpdateProductDto } from '@app/common/dtos/catalog/product.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllProductsDocs,
  ApiGetProductByIdDocs,
  ApiCreateProductDocs,
  ApiUpdateProductDocs,
  ApiDeleteProductDocs,
} from './product.swagger';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
@Public()
export class ProductsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get('')
  @Permissions(Permission.ProductView)
  @ApiGetAllProductsDocs()
  async getAllProducts(
    @Query() PaginationDto: PaginationDto,
  ) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_products' }, PaginationDto),
    );
  }

  @Get('/:id')
  @Permissions(Permission.ProductView)
  @ApiGetProductByIdDocs()
  async getProductById(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_product_by_id' }, id),
    );
  }

  @Post('')
  @Permissions(Permission.ProductCreate)
  @ApiCreateProductDocs()
  async createProduct(@Body() data: CreateProductDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'create_product' }, data),
    );
  }

  @Put('/:id')
  @Permissions(Permission.ProductUpdate)
  @ApiUpdateProductDocs()
  async updateProduct(@Param() id: UuidDto, @Body() data: UpdateProductDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'update_product' }, { id, data }),
    );
  }

  @Delete('/:id')
  @Permissions(Permission.ProductDelete)
  @ApiDeleteProductDocs()
  async deleteProduct(@Param() id: UuidDto) {
    return await firstValueFrom(this.catalogClient.send({ cmd: 'delete_product' }, id));
  }
}
