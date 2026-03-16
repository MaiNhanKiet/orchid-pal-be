import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { PaginationDto, UuidDto } from '@app/common';

@Controller()
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @MessagePattern({ cmd: 'get_all_products' })
  getAllProducts(@Payload() pagination: PaginationDto) {
    return this.productService.getAllProducts(pagination);
  }

  @MessagePattern({ cmd: 'get_product_by_id' })
  getProductById(@Payload() id: UuidDto) {
    return this.productService.getProductById(id.id);
  }

  @MessagePattern({ cmd: 'create_product' })
  createProduct(@Payload() data: CreateProductDto) {
    return this.productService.createProduct(data);
  }

  @MessagePattern({ cmd: 'update_product' })
  updateProduct(
    @Payload() { id, data }: { id: UuidDto; data: UpdateProductDto },
  ) {
    return this.productService.updateProduct(id.id, data);
  }

  @MessagePattern({ cmd: 'delete_product' })
  deleteProduct(@Payload() id: UuidDto) {
    return this.productService.deleteProduct(id.id);
  }

  @MessagePattern({ cmd: 'add_devices_to_product' })
  addDevicesToProduct(
    @Payload() payload: { productId: string; secretKey: string; quantity: number },
  ) {
    return this.productService.addDevicesToProduct(
      payload.productId,
      payload.secretKey,
      payload.quantity,
    );
  }
}
