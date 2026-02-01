import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateProductDto } from '@app/common/dtos/catalog/product.dto';

@Controller()
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @MessagePattern('get_all_products')
  getAllProducts(payload: { page?: number; limit?: number }) {
    return this.productService.getAllProducts(payload);
  }

  @MessagePattern('get_product_by_id')
  getProductById(id: string) {
    return this.productService.getProductById(id);
  }

  @MessagePattern('create_product')
  createProduct(data: CreateProductDto) {
    return this.productService.createProduct(data);
  }

  @MessagePattern('update_product')
  updateProduct(payload: {id: string, data: Object}) {
    return this.productService.updateProduct(payload.id, payload.data);
  }

  @MessagePattern('delete_product')
  deleteProduct(id: string) {
    return this.productService.deleteProduct(id);
  }
}
