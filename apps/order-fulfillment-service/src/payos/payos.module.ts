import { forwardRef, Module } from '@nestjs/common';
import { PayosController } from './payos.controller';
import { PayOSService } from './payos.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule), // ← quan trọng
  ],
  controllers: [PayosController],
  providers: [PayOSService],
  exports: [PayOSService],
})
export class PayOSModule {}
