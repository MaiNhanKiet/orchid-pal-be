import { CreateDeviceDto, MICROSERVICES_CLIENTS, UuidDto } from '@app/common';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
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
    secretKey: string,
    quantity: number,
  ) {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!secretKey) {
      throw new BadRequestException('secret_key is required');
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    // Tìm serial_number lớn nhất hiện tại của product này
    const latestDevice = await this.prisma.devices.findFirst({
      where: { product_id: productId },
      orderBy: { serial_number: 'desc' },
      select: { serial_number: true },
    });

    let latestIndex = 0;
    if (latestDevice && latestDevice.serial_number) {
      // Ví dụ: LAN-CTRL-001-025 -> Lấy "025" -> 25
      const parts = latestDevice.serial_number.split('-');
      const lastPart = parts[parts.length - 1];
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed)) {
        latestIndex = parsed;
      }
    }

    // Tạo serial numbers: {SKU}-001, {SKU}-002, ... tiếp tục từ latestIndex
    const devicesPayload = Array.from({ length: quantity }, (_, i) => ({
      serial_number: `${product.sku}-${String(latestIndex + i + 1).padStart(3, '0')}`,
      secret_key: secretKey,
      product_id: productId,
    }));

    // Gọi create_device song song
    const results = await Promise.all(
      devicesPayload.map((payload) =>
        firstValueFrom(
          this.deviceRegistryClient.send({ cmd: 'create_device' }, payload),
        ),
      ),
    );

    const updatedProduct = await this.prisma.products.update({
      where: { id: productId },
      data: {
        stock_quantity: {
          increment: results.length,
        },
      },
      select: {
        id: true,
        stock_quantity: true,
      },
    });

    return {
      product_id: productId,
      created: results.length,
      stock_quantity: updatedProduct.stock_quantity,
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
