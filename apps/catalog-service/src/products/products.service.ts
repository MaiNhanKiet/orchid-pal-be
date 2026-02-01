import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@app/common/constants/pagination.constant';
import { CreateProductDto } from '@app/common/dtos/catalog/product.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllProducts({ page, limit }: { page?: number; limit?: number }) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const products = await this.prisma.products.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    const users = await this.prisma.users.findMany();
    console.log('Users:', users);
    
    return {
      products,
      page,
      limit,
      total: await this.prisma.products.count(),
      totalPages: limit ? Math.ceil((await this.prisma.products.count()) / limit) : 1,
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.products.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createProduct(data: CreateProductDto) {
    const product = await this.prisma.products.create({
      data,
    });
    // const product = {...data, id: 'sample-id'};
    return product;
  }

  async updateProduct(id: string, data: Object) {
    try {
      const product = await this.prisma.products.update({
        where: { id },
        data,
      });
      return product;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
    }
  }

  async deleteProduct(id: string) {
    try {
      const product = await this.prisma.products.delete({
        where: { id },
      });
      return product;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
    }
  }
}
