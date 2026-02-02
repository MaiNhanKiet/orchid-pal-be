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
import { IdDto, MICROSERVICES_CLIENTS, PaginationDto, Permissions, UuidDto } from '@app/common';
import { Permission } from '@app/common/enums';
import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiGetAllTransactionsDocs, ApiGetTransactionByIdDocs, ApiGetTransactionsByUserIdDocs, ApiGetTransactionsByOrderIdDocs } from './transaction.swagger';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
@Public()
export class TransactionsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Get('')
  @ApiGetAllTransactionsDocs()
  @Permissions(Permission.TransactionView)
  async getAllTransactions(
  ) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_all_transactions' }, {}),
    );
  }

  @Get('/:id')
  @ApiGetTransactionByIdDocs()
  @Permissions(Permission.TransactionView)
  async getTransactionById(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_transaction_by_id' }, id),
    );
  }

  @Get('/user/:id')
  @ApiGetTransactionsByUserIdDocs()
  @Permissions(Permission.TransactionView)
  async getTransactionsByUserId(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_transactions_by_user_id' }, id),
    );
  }

  @ApiGetTransactionsByOrderIdDocs()
  @Get('/order/:id')
  @Permissions(Permission.TransactionView)
  async getTransactionsByOrderId(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'get_transactions_by_order_id' }, id),
    );
  }

}
