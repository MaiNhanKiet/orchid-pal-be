import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Permissions } from '@app/common';
import { Permission } from '@app/common/enums';
import { ProductService } from './product.service';
import { Public } from '@app/common';
import { CreateProductDto } from '@app/common/dtos/catalog/product.dto';

@Controller('products')
@Public()
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get('get-all')
  getAllProducts(@Body() payload?: { page?: number; limit?: number }) {
    return this.productService.getAllProducts(payload);
  }

  @Get('get-by-id/:id')
  getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Post('create')
  @Permissions(Permission.ProductCreate)
  createProduct(@Body() data: CreateProductDto) {
    return this.productService.createProduct(data);
  }
  
  @Put('update/:id')
  @Permissions(Permission.ProductUpdate)
  updateProduct(@Param('id') id: string, @Body() data: Object) {
    return this.productService.updateProduct(id, data);
  }

  @Delete('delete/:id')
  @Permissions(Permission.ProductDelete)
  deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
