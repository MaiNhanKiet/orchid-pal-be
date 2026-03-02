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

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
@Public()
export class TransactionsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly orderFulfillmentClient: ClientProxy,
  ) {}

  @Get('')
  @ApiGetAllTransactionsDocs()
  @Permissions(Permission.TransactionView)
  async getAllTransactions() {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'get_all_transactions' }, {}),
    );
  }

  @Get('/:id')
  @ApiGetTransactionByIdDocs()
  @Permissions(Permission.TransactionView)
  async getTransactionById(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'get_transaction_by_id' }, id),
    );
  }

  @Get('/user/:id')
  @ApiGetTransactionsByUserIdDocs()
  @Permissions(Permission.TransactionView)
  async getTransactionsByUserId(
    @Param() id: UuidDto,
    @Query() pagination: PaginationDto,
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_transactions_by_user_id' },
        { id, pagination },
      ),
    );
  }

  @Get('/user')
  @ApiGetTransactionsOfUserDocs()
  @Permissions(Permission.TransactionView)
  async getTransactionsOfUser(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const id = {
      id: user.sub,
    } as UuidDto;
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_transactions_by_user_id' },
        { id, pagination },
      ),
    );
  }

  @ApiGetTransactionsByOrderIdDocs()
  @Get('/order/:id')
  @Permissions(Permission.TransactionView)
  async getTransactionsByOrderId(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_transactions_by_order_id' },
        id,
      ),
    );
  }

  @Put('/:id')
  @ApiUpdateTransactionDocs()
  @Permissions(Permission.TransactionUpdate)
  async updateTransaction(
    @Param() id: UuidDto,
    @Body() dto: UpdateTransactionDto,
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'update_transaction' },
        { id, dto },
      ),
    );
  }

  @Delete('/:id')
  @ApiDeleteTransactionDocs()
  @Permissions(Permission.TransactionDelete)
  async deleteTransaction(@Param() id: UuidDto) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'delete_transaction' }, id),
    );
  }
}
