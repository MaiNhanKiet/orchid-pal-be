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
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UuidDto,
} from '@app/common';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
} from '@app/common/dtos/catalog/cart.dto';
import { Permission } from '@app/common/enums';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllCartItemsDocs,
  ApiGetCartItemsByUserDocs,
  ApiAddItemToCartDocs,
  ApiRemoveItemFromCartDocs,
  ApiUpdateCartItemDocs,
  ApiGetCartItemsOfUserDocs,
} from './cart.swagger';

@ApiTags('Carts')
@ApiBearerAuth('access-token')
@Controller('carts')
// @Public()
export class CartsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get()
  // @Permissions(Permission.CartView)
  @ApiGetAllCartItemsDocs()
  getAllCartItems() {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_cart_items' }, {}),
    );
  }

  @Get('/user/:id')
  // @Permissions(Permission.CartView)
  @ApiGetCartItemsByUserDocs()
  getCartItemsByUserId(
    @Param() userId: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    console.log('UserId: ', userId);
    console.log('Pagination: ', pagination);
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'get_cart_items_by_user_id' },
        { userId, pagination },
      ),
    );
  }

  @Get('/user')
  // @Permissions(Permission.CartView)
  @ApiGetCartItemsOfUserDocs()
  getCartItemsOfUser(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const userId: UuidDto = { id: user.sub };
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'get_cart_items_by_user_id' },
        { userId, pagination },
      ),
    );
  }

  @Post()
  // @Permissions(Permission.CartCreate)
  @ApiAddItemToCartDocs()
  addItemToCart(
    @CurrentUser() user: JwtPayload,
    @Body() data: CreateCartItemDto,
  ) {
    data.userId = user.sub;
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'add_item_to_cart' }, data),
    );
  }

  @Delete('/:id')
  // @Permissions(Permission.CartDelete)
  @ApiRemoveItemFromCartDocs()
  removeItemFromCart(@Param() id: UuidDto) {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'remove_item_from_cart' }, id),
    );
  }

  @Put('/:id')
  // @Permissions(Permission.CartUpdate)
  @ApiUpdateCartItemDocs()
  updateCartItem(
    @Param() cartItemId: UuidDto,
    @Body() payload: UpdateCartItemDto,
  ) {
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'update_cart_item' },
        {
          cartItemId,
          payload,
        },
      ),
    );
  }
}
