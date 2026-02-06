import { Controller } from '@nestjs/common';
import { PayOSService } from './payos.service';
import { PrismaService } from '@app/prisma';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Webhook } from '@payos/node';

@Controller()
export class PayosController {
  constructor(
    private payOSService: PayOSService,
    private prisma: PrismaService,
  ) {}

  @MessagePattern({ cmd: 'handle_webhook' })
  handleWehook(@Payload() { body }: { body: Webhook }) {
    return this.payOSService.handleWebhook(body);
  }
}
