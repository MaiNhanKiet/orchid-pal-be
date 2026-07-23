import { Module } from '@nestjs/common';
import { ExpertConsultationModule } from '../../expert-consultation/expert-consultation.module';
import { DeviceQrService } from './device-qr.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [ExpertConsultationModule],
  controllers: [DevicesController],
  providers: [DeviceQrService],
})
export class DevicesModule {}
