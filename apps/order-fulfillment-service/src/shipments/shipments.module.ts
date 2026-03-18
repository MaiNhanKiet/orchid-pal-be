import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { AddressesController } from './addresses.controller';
import { AddressService } from './address.service';

@Module({
  imports: [],
  controllers: [ShipmentsController, AddressesController],
  providers: [ShipmentsService, AddressService],
})
export class ShipmentsModule {}
