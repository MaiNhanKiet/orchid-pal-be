import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@app/common/constants/pagination.constant';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CartsService {
  constructor(private prisma: PrismaService) {}

  async getAllCartItems() {
    return this.prisma.cart_items.findMany();
  }

  async getCartItemsByUserId(
    userId: string,
    { page, limit }: { page: number; limit: number },
  ) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const cartItems = await this.prisma.cart_items.findMany({
      where: {
        user_id: userId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    if (!cartItems || cartItems.length === 0) {
      throw new NotFoundException('Cart items not found');
    }
    return cartItems;
  }

  async addItemToCart(userId: string, productId: string, quantity: number) {
    console.log("Adding item to cart:", userId, productId, quantity);

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
    const cartItem = await this.prisma.cart_items.create({
      data: {
        user_id: userId,
        product_id: productId,
        quantity,
      },
    });
    
    return cartItem;
  }

  async removeItemFromCart(cartItemId: string) {
    try {
      const cartItem = await this.prisma.cart_items.delete({
        where: { id: cartItemId },
      });
      return cartItem;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cart item not found');
      }
    }
  }

  async updateCartItemQuantity(cartItemId: string, quantity: number) {
    try {
      const cartItem = await this.prisma.cart_items.update({
        where: { id: cartItemId },
        data: { quantity },
      });
      return cartItem;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cart item not found');
      }
    }
  }
}
