import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { MICROSERVICES_CLIENTS, Permissions } from '@app/common';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';

@Controller('carts')
@Public()
export class CartsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get()
  getAllCartItems() {
    return firstValueFrom(this.catalogClient.send('get_all_cart_items', {}));
  }

  @Get('/:userId')
  getCartItemsByUserId(
    @Param('userId') userId: string,
    @Param('page') page?: number,
    @Param('limit') limit?: number,
  ) {
    return firstValueFrom(
      this.catalogClient.send('get_cart_items_by_user_id', {
        userId,
        page,
        limit,
      }),
    );
  }

  @Post()
  addItemToCart(
    @Body() CreateCartItemDto: CreateCartItemDto,
  ) {
    return firstValueFrom(this.catalogClient.send('add_item_to_cart', CreateCartItemDto));
  }

  @Delete('/:cartItemId')
  removeItemFromCart(@Param('cartItemId') cartItemId: string) {
    return firstValueFrom(
      this.catalogClient.send('remove_item_from_cart', cartItemId),
    );
  }

  @Put('/:cartItemId')
  updateCartItemQuantity(
    @Param('cartItemId') cartItemId: string,
    @Body() payload: { quantity: number },
  ) {
    return firstValueFrom(
      this.catalogClient.send('update_cart_item_quantity', {
        cartItemId,
        ...payload,
      }),
    );
  }
}
