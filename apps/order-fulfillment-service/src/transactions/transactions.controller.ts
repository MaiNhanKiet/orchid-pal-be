import { Controller } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionsService } from './transactions.service';
import { PaginationDto, UuidDto } from '@app/common';
import { UpdateTransactionDto } from '@app/common/dtos/order-fulfillment/update-transaction.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @MessagePattern({ cmd: 'get_all_transactions' })
  getAllTransactions() {
    return this.transactionsService.getAllTransactions();
  }

  @MessagePattern({ cmd: 'get_transaction_by_id' })
  getTransactionById(@Payload() id: UuidDto) {
    return this.transactionsService.getTransactionById(id.id);
  }

  @MessagePattern({ cmd: 'get_transactions_by_order_id' })
  getTransactionsByOrderId(@Payload() id: UuidDto) {
    return this.transactionsService.getTransactionsByOrderId(id.id);
  }

  @MessagePattern({ cmd: 'get_transactions_by_user_id' })
  getTransactionsByUserId(
    @Payload() { id, pagination }: { id: UuidDto; pagination: PaginationDto },
  ) {
    return this.transactionsService.getTransactionsByUserId(id.id, pagination);
  }

  @MessagePattern({ cmd: 'update_transaction' })
  updateTransaction(
    @Payload() { id, dto }: { id: UuidDto; dto: UpdateTransactionDto },
  ) {
    return this.transactionsService.updateTransaction(id.id, dto);
  }

  @MessagePattern({ cmd: 'delete_transaction' })
  deleteTransaction(@Payload() id: UuidDto) {
    return this.transactionsService.deleteTransaction(id.id);
  }
}
