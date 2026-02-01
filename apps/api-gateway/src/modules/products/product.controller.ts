import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { MICROSERVICES_CLIENTS, Permissions } from '@app/common';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import { CreateProductDto } from '@app/common/dtos/catalog/product.dto';
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
  async getAllProducts(@Body() payload?: { page?: number; limit?: number }) {
    return await firstValueFrom(
      this.catalogClient.send('get_all_products', payload),
    );
  }

  @Get('/:id')
  async getProductById(@Param('id') id: string) {
    return await firstValueFrom(
      this.catalogClient.send('get_product_by_id', id),
    );
  }

  @Post('')
  @Permissions(Permission.ProductCreate)
  async createProduct(@Body() data: CreateProductDto) {
    return await firstValueFrom(
      this.catalogClient.send('create_product', data),
    );
  }

  @Put('/:id')
  @Permissions(Permission.ProductUpdate)
  async updateProduct(@Param('id') id: string, @Body() data: Object) {
    return await firstValueFrom(
      this.catalogClient.send('update_product', { id, data }),
    );
  }

  @Delete('/:id')
  @Permissions(Permission.ProductDelete)
  async deleteProduct(@Param('id') id: string) {
    return await firstValueFrom(this.catalogClient.send('delete_product', id));
  }
}
