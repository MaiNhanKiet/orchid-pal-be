import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  UuidDto,
} from '@app/common';

import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
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
}
