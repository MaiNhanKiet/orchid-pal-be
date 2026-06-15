import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { PaginationDto, UuidDto } from '@app/common';

@Controller()
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @GrpcCmd('get_all_products')
  getAllProducts(@Payload() pagination: PaginationDto) {
    return this.productService.getAllProducts(pagination);
  }

  @GrpcCmd('get_product_by_id')
  getProductById(@Payload() id: UuidDto) {
    return this.productService.getProductById(id.id);
  }

  @GrpcCmd('create_product')
  createProduct(@Payload() data: CreateProductDto) {
    return this.productService.createProduct(data);
  }

  @GrpcCmd('update_product')
  updateProduct(
    @Payload() { id, data }: { id: UuidDto; data: UpdateProductDto },
  ) {
    return this.productService.updateProduct(id.id, data);
  }

  @GrpcCmd('delete_product')
  deleteProduct(@Payload() id: UuidDto) {
    return this.productService.deleteProduct(id.id);
  }

  @GrpcCmd('add_devices_to_product')
  addDevicesToProduct(
    @Payload()
    payload: {
      productId: string;
      secretKey: string;
      quantity: number;
    },
  ) {
    return this.productService.addDevicesToProduct(
      payload.productId,
      payload.secretKey,
      payload.quantity,
    );
  }
}
