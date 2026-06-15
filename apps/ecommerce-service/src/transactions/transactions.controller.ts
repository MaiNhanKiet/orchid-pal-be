import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';

import { Payload } from '@nestjs/microservices';
import { TransactionsService } from './transactions.service';
import { PaginationDto, UuidDto } from '@app/common';
import { UpdateTransactionDto } from '@app/common/dtos/order-fulfillment/update-transaction.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @GrpcCmd('get_all_transactions')
  getAllTransactions() {
    return this.transactionsService.getAllTransactions();
  }

  @GrpcCmd('get_transaction_by_id')
  getTransactionById(@Payload() id: UuidDto) {
    return this.transactionsService.getTransactionById(id.id);
  }

  @GrpcCmd('get_transactions_by_order_id')
  getTransactionsByOrderId(@Payload() id: UuidDto) {
    return this.transactionsService.getTransactionsByOrderId(id.id);
  }

  @GrpcCmd('get_transactions_by_user_id')
  getTransactionsByUserId(
    @Payload() { id, pagination }: { id: UuidDto; pagination: PaginationDto },
  ) {
    return this.transactionsService.getTransactionsByUserId(id.id, pagination);
  }

  @GrpcCmd('update_transaction')
  updateTransaction(
    @Payload() { id, dto }: { id: UuidDto; dto: UpdateTransactionDto },
  ) {
    return this.transactionsService.updateTransaction(id.id, dto);
  }

  @GrpcCmd('delete_transaction')
  deleteTransaction(@Payload() id: UuidDto) {
    return this.transactionsService.deleteTransaction(id.id);
  }

  @GrpcCmd('get_transaction_overview')
  getTransactionOverview() {
    return this.transactionsService.getTransactionOverview();
  }
}
