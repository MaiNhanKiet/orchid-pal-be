import { Controller } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionsService } from './transactions.service';
import { PaginationDto, UuidDto } from '@app/common';

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
}
