import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';

import { Payload } from '@nestjs/microservices';
import { CartsService } from './carts.service';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
} from '@app/common/dtos/catalog/cart.dto';
import { PaginationDto, UuidDto } from '@app/common';

@Controller()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @GrpcCmd('get_all_cart_items')
  getAllCartItems() {
    return this.cartsService.getAllCartItems();
  }

  @GrpcCmd('get_cart_items_by_user_id')
  getCartItemsByUserId(
    @Payload()
    { userId, pagination }: { userId: UuidDto; pagination: PaginationDto },
  ) {
    return this.cartsService.getCartItemsByUserId(userId.id, pagination);
  }

  @GrpcCmd('add_item_to_cart')
  addItemToCart(@Payload() data: CreateCartItemDto) {
    return this.cartsService.addItemToCart(data);
  }

  @GrpcCmd('remove_item_from_cart')
  removeItemFromCart(@Payload() id: UuidDto) {
    return this.cartsService.removeItemFromCart(id.id);
  }

  @GrpcCmd('update_cart_item')
  updateCartItem(
    @Payload()
    {
      cartItemId,
      payload,
    }: {
      cartItemId: UuidDto;
      payload: UpdateCartItemDto;
    },
  ) {
    return this.cartsService.updateCartItem(
      cartItemId.id,
      payload.quantity,
      payload.isSelected,
    );
  }

  @GrpcCmd('clear_cart')
  clearCart(@Payload() id: UuidDto) {
    return this.cartsService.clearCart(id.id);
  }
}
