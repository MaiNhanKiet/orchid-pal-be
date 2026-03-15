import { CreateDeviceDto, MICROSERVICES_CLIENTS, UuidDto } from '@app/common';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE)
    private readonly deviceRegistryClient: ClientProxy,
  ) {}

  async getAllProducts({ page, limit }: { page?: number; limit?: number }) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const products = await this.prisma.products.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    // const users = await this.prisma.users.findMany();
    // console.log('Users:', users);

    return {
      products,
      page,
      limit,
      total: await this.prisma.products.count(),
      totalPages: limit
        ? Math.ceil((await this.prisma.products.count()) / limit)
        : 1,
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
    return product;
  }

  async addDevicesToProduct(data: CreateDeviceDto[]) {
    const devices = data.map((dto) => {
      return firstValueFrom(
        this.deviceRegistryClient.send({ cmd: 'create_device' }, dto),
      );
    });
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const product = await this.prisma.products.update({
      where: { id },
      data,
    });
    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.products.delete({
      where: { id },
    });
    return product;
  }
}
