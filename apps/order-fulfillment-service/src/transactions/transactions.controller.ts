import { Controller } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { TransactionsService } from './transactions.service';

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @MessagePattern('get_all_transactions')
  getAllTransactions() {
    return this.transactionsService.getAllTransactions();
  }

  @MessagePattern('get_transaction_by_id')
  getTransactionById(id: string) {
    return this.transactionsService.getTransactionById(id);
  }

  @MessagePattern('get_transactions_by_order_id')
  getTransactionsByOrderId(orderId: string) {
    return this.transactionsService.getTransactionsByOrderId(orderId);
  }

  @MessagePattern('get_transactions_by_user_id')
  getTransactionsByUserId(userId: string, { page, limit }: any) {
    return this.transactionsService.getTransactionsByUserId(userId, { page, limit });
  }
}
