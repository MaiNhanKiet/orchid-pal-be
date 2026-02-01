import { Controller } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { CartsService } from './carts.service';

@Controller()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

    @MessagePattern('get_all_cart_items')
    getAllCartItems() {
      return this.cartsService.getAllCartItems();
    }

    @MessagePattern('get_cart_items_by_user_id')
    getCartItemsByUserId(payload: {userId: string, page: number, limit: number}) {
      return this.cartsService.getCartItemsByUserId(payload.userId, { page: payload.page, limit: payload.limit });
    }

    @MessagePattern('add_item_to_cart')
    addItemToCart(payload: {userId: string, productId: string, quantity: number}) {
      console.log("Controller received payload:", payload);
      return this.cartsService.addItemToCart(payload.userId, payload.productId, payload.quantity);
    }

    @MessagePattern('remove_item_from_cart')
    removeItemFromCart(cartItemId: string) {
      return this.cartsService.removeItemFromCart(cartItemId);
    }

    @MessagePattern('update_cart_item_quantity')
    updateCartItemQuantity(payload: {cartItemId: string, quantity: number}) {
      return this.cartsService.updateCartItemQuantity(payload.cartItemId, payload.quantity);
    }
}
