import { Controller } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { CartsService } from './carts.service';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';

@Controller()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

    @MessagePattern('get_all_cart_items')
    getAllCartItems() {
      return this.cartsService.getAllCartItems();
    }

    @MessagePattern('get_cart_items_by_user_id')
    getCartItemsByUserId({userId, page, limit}: {userId: string, page: number, limit: number}) {
      return this.cartsService.getCartItemsByUserId(userId, { page, limit });
    }

    @MessagePattern('add_item_to_cart')
    addItemToCart(data: CreateCartItemDto) {
      return this.cartsService.addItemToCart(data);
    }

    @MessagePattern('remove_item_from_cart')
    removeItemFromCart(cartItemId: string) {
      return this.cartsService.removeItemFromCart(cartItemId);
    }

    @MessagePattern('update_cart_item_quantity')
    updateCartItemQuantity({cartItemId, quantity}: {cartItemId: string, quantity: number}) {
      return this.cartsService.updateCartItemQuantity(cartItemId, quantity);
    }
}
