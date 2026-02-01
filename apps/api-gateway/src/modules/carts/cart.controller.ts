import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UuidDto,
} from '@app/common';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
import { Permission } from '@app/common/enums';

@Controller('carts')
@Public()
export class CartsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(Permission.CartView)
  getAllCartItems() {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_cart_items' }, {}),
    );
  }

  @Get('/:userId')
  @Permissions(Permission.CartView)
  getCartItemsByUserId(
    @Param() userId: UuidDto,
    @Query() PaginationDto: PaginationDto,
  ) {
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'get_cart_items_by_user_id' },
        { userId, PaginationDto },
      ),
    );
  }

  @Post()
  @Permissions(Permission.CartCreate)
  addItemToCart(@Body() CreateCartItemDto: CreateCartItemDto) {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'add_item_to_cart' }, CreateCartItemDto),
    );
  }

  @Delete('/:cartItemId')
  @Permissions(Permission.CartDelete)
  removeItemFromCart(@Param() cartItemId: UuidDto) {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'remove_item_from_cart' }, cartItemId),
    );
  }

  @Put('/:cartItemId')
  @Permissions(Permission.CartUpdate)
  updateCartItemQuantity(
    @Param() cartItemId: UuidDto,
    @Body('quantity') quantity: number,
  ) {
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'update_cart_item_quantity' },
        {
          cartItemId,
          quantity,
        },
      ),
    );
  }
}
