import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@app/common/dtos/catalog/product.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts({ page, limit }: { page?: number; limit?: number }) {
    page = page ?? DEFAULT_PAGE;
    limit = limit ?? DEFAULT_LIMIT;

    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where: { is_published: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.products.count({ where: { is_published: true } }),
    ]);

    return {
      products: products.map((p) => this.withSpecsAlias(p)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllProductsAdmin({ page, limit }: { page?: number; limit?: number }) {
    page = page ?? DEFAULT_PAGE;
    limit = limit ?? DEFAULT_LIMIT;

    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.products.count(),
    ]);

    return {
      products: products.map((p) => this.withSpecsAlias(p)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return this.withSpecsAlias(product);
  }

  private resolveFeaturesJson(data: {
    features_json?: Record<string, unknown>;
    specs_config?: Record<string, unknown>;
  }) {
    if (data.features_json !== undefined) return data.features_json as object;
    if (data.specs_config !== undefined) return data.specs_config as object;
    return undefined;
  }

  private withSpecsAlias<T extends { features_json?: unknown }>(product: T) {
    return {
      ...product,
      specs_config: product.features_json ?? null,
    };
  }

  async createProduct(data: CreateProductDto) {
    const product = await this.prisma.products.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        price: data.price,
        features_json: this.resolveFeaturesJson(data),
        image_url: data.image_url,
        buy_link: data.buy_link,
        is_published: data.is_published ?? true,
      },
    });
    return this.withSpecsAlias(product);
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    await this.getProductById(id);
    const { specs_config: _specs, features_json: _features, ...rest } = data;
    const featuresJson = this.resolveFeaturesJson(data);
    const product = await this.prisma.products.update({
      where: { id },
      data: {
        ...rest,
        ...(featuresJson !== undefined ? { features_json: featuresJson } : {}),
      },
    });
    return this.withSpecsAlias(product);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);
    await this.prisma.products.delete({ where: { id } });
    return { message: 'Đã xóa sản phẩm' };
  }
}
