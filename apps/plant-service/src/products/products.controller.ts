import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { PaginationDto, UuidDto } from '@app/common';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @GrpcCmd('get_all_products')
  getAllProducts(@Payload() pagination: PaginationDto) {
    return this.productsService.getAllProducts(pagination);
  }

  @GrpcCmd('get_all_products_admin')
  getAllProductsAdmin(@Payload() pagination: PaginationDto) {
    return this.productsService.getAllProductsAdmin(pagination);
  }

  @GrpcCmd('get_product_by_id')
  getProductById(@Payload() id: UuidDto) {
    return this.productsService.getProductById(id.id);
  }

  @GrpcCmd('create_product')
  createProduct(@Payload() data: CreateProductDto) {
    return this.productsService.createProduct(data);
  }

  @GrpcCmd('update_product')
  updateProduct(
    @Payload() { id, data }: { id: UuidDto; data: UpdateProductDto },
  ) {
    return this.productsService.updateProduct(id.id, data);
  }

  @GrpcCmd('delete_product')
  deleteProduct(@Payload() id: UuidDto) {
    return this.productsService.deleteProduct(id.id);
  }
}
