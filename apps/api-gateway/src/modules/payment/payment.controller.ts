import { Body, Controller, Inject, Param, Post, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  UuidDto,
} from '@app/common';

import { Public } from '@app/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { firstValueFrom, fromEvent, map, Observable } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiHandlePayOSWebhookDocs,
  ApiCheckOutDocs,
  ApiCancelPaymentDocs,
  ApiGetPaymentInformationDocs,
} from './payment.swagger';

import { type Webhook } from '@payos/node';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';

@ApiTags('Payment')
@ApiBearerAuth('access-token')
@Controller('payment')
// @Public()
export class PaymentController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly orderFulfillmentClient: ClientProxy,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('/webhooks/payos')
  @Public()
  @ApiHandlePayOSWebhookDocs()
  async handlePayOS(@Body() body: Webhook) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send({ cmd: 'handle_webhook' }, { body }),
    );
  }

  @Post('/check-out')
  // @Permissions(Permission.OrderCreate)
  @ApiCheckOutDocs()
  async checkOut(
    @CurrentUser() user: JwtPayload,
    @Body() checkOutDto: CheckoutDto,
  ) {
    const id: UuidDto = { id: user.sub };

    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'check_out' },
        { id, checkOutDto },
      ),
    );
  }

  @Post('/cancel-payment')
  // @Permissions(Permission.OrderCreate)
  @ApiCancelPaymentDocs()
  async cancelPayment(
    @Body()
    { orderCode, cancelReason }: { orderCode: string; cancelReason: string },
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'cancel_payment' },
        { orderCode, cancelReason },
      ),
    );
  }

  @Post('/get-payment-information')
  // @Permissions(Permission.OrderCreate)
  @ApiGetPaymentInformationDocs()
  async getPaymentInformation(
    @Param()
    { paymentLinkId }: { paymentLinkId: string },
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_payment_information' },
        { paymentLinkId },
      ),
    );
  }

  @EventPattern('payment_status_updated')
  handlePaymentStatusFromRMQ(@Payload() data: { orderCode: string; status: string; message: string }) {
    // Phát event nội bộ trong API Gateway để SSE client bắt được
    this.eventEmitter.emit(`payment.update.${data.orderCode}`, data);
  }

  @Sse('/sse/:orderCode')
  @Public()
  ssePaymentStatus(@Param('orderCode') orderCode: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `payment.update.${orderCode}`).pipe(
      map(
        (data) =>
          ({
            data: data,
          }) as MessageEvent,
      ),
    );
  }
}
