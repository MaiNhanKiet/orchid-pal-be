import { forwardRef, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { PayOSModule } from '../payos/payos.module';

@Module({
  imports: [
    forwardRef(() => PayOSModule), // ← quan trọng
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
