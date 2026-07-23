import { Module, forwardRef } from '@nestjs/common';
import { RmqModule } from '@app/common';
import { PrismaModule } from '@app/prisma';
import { AutomationModule } from '../automation/automation.module';
import { DevicesController } from './devices.controller';
import { DeviceService } from './devices.service';

@Module({
  imports: [
    PrismaModule,
    RmqModule.register('AUTOMATION'),
    forwardRef(() => AutomationModule),
  ],
  controllers: [DevicesController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DevicesModule {}
