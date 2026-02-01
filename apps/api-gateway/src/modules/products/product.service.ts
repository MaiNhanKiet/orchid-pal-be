import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
// Constant tên service bạn định nghĩa trong libs/common/constants
import { MICROSERVICES_CLIENTS, GoogleLoginDto } from '@app/common';
import { CreateProductDto } from '@app/common/dtos/catalog/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  async getAllProducts(payload?: { page?: number; limit?: number }) {
    return await firstValueFrom(
      this.catalogClient.send('get_all_products', payload),
    );
  }

  async getProductById(id: string) {
    console.log("Product id: ", id);
    
    return await firstValueFrom(
      this.catalogClient.send('get_product_by_id', id ),
    );
  }

  async createProduct(data: CreateProductDto) {
    return await firstValueFrom(
      this.catalogClient.send('create_product', data),
    );
  }

  async updateProduct(id: string, data: Object) {
    return await firstValueFrom(
      this.catalogClient.send('update_product', {id, data}),
    );
  }

  async deleteProduct(id: string) {
    return await firstValueFrom(
      this.catalogClient.send('delete_product', id),
    );
  }
}