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
  Req,
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
import { CreateCartItemDto, UpdateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
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
@Public()
export class CartsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.CATALOG_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(Permission.CartView)
  @ApiGetAllCartItemsDocs()
  getAllCartItems() {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_cart_items' }, {}),
    );
  }

  @Get('/user/:userId')
  @Permissions(Permission.CartView)
  @ApiGetCartItemsByUserDocs()
  getCartItemsByUserId(
    @Param() userId: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'get_cart_items_by_user_id' },
        { userId, pagination },
      ),
    );
  }

  @Get('/user')
  @Permissions(Permission.CartView)
  @ApiGetCartItemsOfUserDocs()
  getCartItemsOfUser(
    @Req() req,
    @Query() pagination: PaginationDto,
  ) {
    const userId = req.user;
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'get_cart_items_by_user_id' },
        { userId, pagination },
      ),
    );
  }

  @Post()
  @Permissions(Permission.CartCreate)
  @ApiAddItemToCartDocs()
  addItemToCart(@Body() data: CreateCartItemDto) {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'add_item_to_cart' }, data),
    );
  }

  @Delete('/:cartItemId')
  @Permissions(Permission.CartDelete)
  @ApiRemoveItemFromCartDocs()
  removeItemFromCart(@Param() id: UuidDto) {
    return firstValueFrom(
      this.catalogClient.send({ cmd: 'remove_item_from_cart' }, id),
    );
  }

  @Put('/:cartItemId')
  @Permissions(Permission.CartUpdate)
  @ApiUpdateCartItemDocs()
  updateCartItem(
    @Param() cartItemId: UuidDto,
    @Body() payload: UpdateCartItemDto
  ) {
    return firstValueFrom(
      this.catalogClient.send(
        { cmd: 'update_cart_item' },
        {
          cartItemId,
          payload
        },
      ),
    );
  }
}
