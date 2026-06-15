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
import { GrpcRpcService } from '@app/grpc';
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
  ApiClearCartDocs,
} from './cart.swagger';

@ApiTags('05 - Carts')
@ApiBearerAuth('access-token')
@Controller('carts')
// @Public()
export class CartsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  // @Permissions(Permission.CartView)
  @ApiGetAllCartItemsDocs()
  getAllCartItems() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_all_cart_items', {});
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
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_cart_items_by_user_id', { userId, pagination });
  }

  @Get('/user')
  // @Permissions(Permission.CartView)
  @ApiGetCartItemsOfUserDocs()
  getCartItemsOfUser(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const userId: UuidDto = { id: user.sub };
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_cart_items_by_user_id', { userId, pagination });
  }

  @Post()
  // @Permissions(Permission.CartCreate)
  @ApiAddItemToCartDocs()
  addItemToCart(
    @CurrentUser() user: JwtPayload,
    @Body() data: CreateCartItemDto,
  ) {
    data.userId = user.sub;
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'add_item_to_cart', data);
  }

  @Delete('/clear')
  // @Permissions(Permission.CartDelete)
  @ApiClearCartDocs()
  clearCart(@CurrentUser() user: JwtPayload) {
    const id: UuidDto = { id: user.sub };
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'clear_cart', id);
  }

  @Delete('/:id')
  // @Permissions(Permission.CartDelete)
  @ApiRemoveItemFromCartDocs()
  removeItemFromCart(@Param() id: UuidDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'remove_item_from_cart', id);
  }

  @Put('/:id')
  // @Permissions(Permission.CartUpdate)
  @ApiUpdateCartItemDocs()
  updateCartItem(
    @Param() cartItemId: UuidDto,
    @Body() payload: UpdateCartItemDto,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'update_cart_item', {
          cartItemId,
          payload,
        });
  }
}
