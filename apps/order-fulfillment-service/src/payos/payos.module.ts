import { Module } from '@nestjs/common';
import { PayosController  } from './payos.controller';
import { PayOSService } from './payos.service';

@Module({
  imports: [],
  controllers: [PayosController],
  providers: [PayOSService],
})
export class OrdersModule {}
