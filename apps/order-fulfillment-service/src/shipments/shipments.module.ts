import { Module } from '@nestjs/common';
import { ShipmentsController  } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
