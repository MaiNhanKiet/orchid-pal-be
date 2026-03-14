import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CartsService {
  constructor(private prisma: PrismaService) {}

  async getAllCartItems() {
    return this.prisma.cart_items.findMany({
      include: { products: true },
    });
  }

  async getCartItemsByUserId(
    userId: string,
    { page, limit }: { page?: number; limit?: number },
  ) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const cartItems = await this.prisma.cart_items.findMany({
      where: {
        user_id: userId,
      },
      include: { products: true },
      skip: (page - 1) * limit,
      take: limit,
    });
    if (!cartItems || cartItems.length === 0) {
      throw new NotFoundException('Cart items not found');
    }
    return cartItems;
  }

  async addItemToCart(data: CreateCartItemDto) {
    const { userId, productId, quantity } = data;

    const user = await this.prisma.users.findFirst({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const product = await this.prisma.products.findFirst({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existedCartItems = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
      },
    });
    if (existedCartItems) {
      return this.prisma.cart_items.update({
        where: { id: existedCartItems.id },
        data: { quantity: existedCartItems.quantity + quantity },
      });
    } else {
      const cartItem = await this.prisma.cart_items.create({
        data: {
          user_id: userId,
          product_id: productId,
          quantity,
        },
      });
      return cartItem;
    }
  }

  async removeItemFromCart(cartItemId: string) {
    const cartItem = await this.prisma.cart_items.delete({
      where: { id: cartItemId },
    });
    return cartItem;
  }

  async updateCartItem(
    cartItemId: string,
    quantity?: number,
    isSelected?: boolean,
  ) {
    const cartItem = await this.prisma.cart_items.update({
      where: { id: cartItemId },
      data: { quantity, is_selected: isSelected },
    });
    return cartItem;
  }

  async clearCart(userId: string) {
    const deletedItems = await this.prisma.cart_items.deleteMany({
      where: {
        user_id: userId,
      },
    });
    return deletedItems;
  }
}
