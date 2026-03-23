import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '@app/prisma';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Webhook } from '@payos/node';
import { UuidDto } from '@app/common';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';

@Controller()
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
  ) {}

  @MessagePattern({ cmd: 'handle_webhook' })
  handleWehook(@Payload() { body }: { body: Webhook }) {
    console.log('Webhook body: ', body);

    return this.paymentService.handleWebhook(body);
  }

  @MessagePattern({ cmd: 'check_out' })
  checkOut(
    @Payload() { id, checkOutDto }: { id: UuidDto; checkOutDto: CheckoutDto },
  ) {
    console.log('Recieved user: ', id);
    console.log('Recieved checkOutDto: ', checkOutDto);

    return this.paymentService.checkout(id.id, checkOutDto);
  }

  @MessagePattern({ cmd: 'cancel_payment' })
  cancelPayment(
    @Payload()
    { orderCode, cancelReason }: { orderCode: number; cancelReason?: string },
  ) {
    // console.log('Recieved orderCode: ', orderCode);
    // console.log('Recieved cancelReason: ', cancelReason);

    return this.paymentService.cancelPayment(orderCode, cancelReason);
  }

  @MessagePattern({ cmd: 'get_payment_information' })
  getPaymentInformation(
    @Payload()
    { paymentLinkId }: { paymentLinkId: string },
  ) {
    console.log('Recieved paymentLinkId: ', paymentLinkId);

    return this.paymentService.getPaymentInformation(paymentLinkId);
  }
}
