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
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    // Emit event (fire & forget) – không chờ device-registry-service
    this.deviceRegistryClient.emit('product_created', product);

    return product;
  }

  async addDevicesToProduct(
    productId: string,
    secretKeys: string[],
  ) {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!Array.isArray(secretKeys) || secretKeys.length === 0) {
      throw new BadRequestException('secret_keys must be a non-empty array');
    }

    const hasDuplicatedSecretKeys = new Set(secretKeys).size !== secretKeys.length;
    if (hasDuplicatedSecretKeys) {
      throw new BadRequestException('Each device must have a unique secret key');
    }

    const quantity = secretKeys.length;

    // Đếm số devices hiện có để tính STT tiếp theo
    const existingCount = await this.prisma.devices.count({
      where: { product_id: productId },
    });

    // Tạo serial numbers: {SKU}-001, {SKU}-002, ...
    const devicesPayload = Array.from({ length: quantity }, (_, i) => ({
      serial_number: `${product.sku}-${String(existingCount + i + 1).padStart(3, '0')}`,
      secret_key: secretKeys[i],
      product_id: productId,
      hardware_config: product.specs_config,
    }));

    // Gọi create_device song song
    const results = await Promise.all(
      devicesPayload.map((payload) =>
        firstValueFrom(
          this.deviceRegistryClient.send({ cmd: 'create_device' }, payload),
        ),
      ),
    );

    return {
      product_id: productId,
      created: results.length,
      devices: results,
    };
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
