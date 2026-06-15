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
  IdDto,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UuidDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllTransactionsDocs,
  ApiGetTransactionByIdDocs,
  ApiGetTransactionsByUserIdDocs,
  ApiGetTransactionsByOrderIdDocs,
  ApiGetTransactionsOfUserDocs,
  ApiUpdateTransactionDocs,
  ApiDeleteTransactionDocs,
} from './transaction.swagger';
import { UpdateTransactionDto } from '@app/common/dtos/order-fulfillment/update-transaction.dto';

@ApiTags('08 - Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
// @Public()
export class TransactionsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('')
  @ApiGetAllTransactionsDocs()
  // @Permissions(Permission.TransactionView)
  async getAllTransactions() {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_all_transactions', {});
  }

  @Get('/overview')
  // @Permissions(Permission.TransactionView)
  async getTransactionOverview() {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_transaction_overview', {});
  }

  @Get('/:id')
  @ApiGetTransactionByIdDocs()
  // @Permissions(Permission.TransactionView)
  async getTransactionById(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_transaction_by_id', id);
  }

  @Get('/user/:id')
  @ApiGetTransactionsByUserIdDocs()
  // @Permissions(Permission.TransactionView)
  async getTransactionsByUserId(
    @Param() id: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_transactions_by_user_id', { id, pagination });
  }

  @Get('/user')
  @ApiGetTransactionsOfUserDocs()
  // @Permissions(Permission.TransactionView)
  async getTransactionsOfUser(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const id = {
      id: user.sub,
    } as UuidDto;
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_transactions_by_user_id', { id, pagination });
  }

  @ApiGetTransactionsByOrderIdDocs()
  @Get('/order/:id')
  // @Permissions(Permission.TransactionView)
  async getTransactionsByOrderId(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_transactions_by_order_id', id);
  }

  @Put('/:id')
  @ApiUpdateTransactionDocs()
  // @Permissions(Permission.TransactionUpdate)
  async updateTransaction(
    @Param() id: UuidDto,
    @Body() dto: UpdateTransactionDto,
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'update_transaction', { id, dto });
  }

  @Delete('/:id')
  @ApiDeleteTransactionDocs()
  // @Permissions(Permission.TransactionDelete)
  async deleteTransaction(@Param() id: UuidDto) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'delete_transaction', id);
  }
}
