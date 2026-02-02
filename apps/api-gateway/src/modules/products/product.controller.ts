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

@Controller('products')
@Public()
export class ProductsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get('')
  @Permissions(Permission.ProductView)
  async getAllProducts(
    @Query() PaginationDto: PaginationDto,
  ) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_products' }, PaginationDto),
    );
  }

  @Get('/:id')
  @Permissions(Permission.ProductView)
  async getProductById(@Param('id') id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_product_by_id' }, id),
    );
  }

  @Post('')
  @Permissions(Permission.ProductCreate)
  async createProduct(@Body() data: CreateProductDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'create_product' }, data),
    );
  }

  @Put('/:id')
  @Permissions(Permission.ProductUpdate)
  async updateProduct(@Param('id') id: UuidDto, @Body() data: UpdateProductDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'update_product' }, { id, data }),
    );
  }

  @Delete('/:id')
  @Permissions(Permission.ProductDelete)
  async deleteProduct(@Param() id: UuidDto) {
    return await firstValueFrom(this.catalogClient.send({ cmd: 'delete_product' }, id));
  }
}
