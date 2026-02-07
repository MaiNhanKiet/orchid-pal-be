import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { MICROSERVICES_CLIENTS } from '@app/common';

import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { type Webhook } from '@payos/node';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';

@ApiBearerAuth('access-token')
@Controller('payment')
// @Public()
export class PaymentController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Post('/webhooks/payos')
  @Public()
  async handlePayOS(@Body() body: Webhook) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'handle_webhook' }, { body }),
    );
  }

  @Post('/check-out')
  // @Permissions(Permission.OrderCreate)
  async checkOut(@Req() req, @Body() checkOutDto: CheckoutDto) {
    const id = {
      id: req.user.sub,
      ...req.user,
    };
    console.log('User: ', id);

    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'check_out' }, { id, checkOutDto }),
    );
  }

  @Post('/cancel-payment')
  // @Permissions(Permission.OrderCreate)
  async cancelPayment(
    @Body()
    { orderCode, cancelReason }: { orderCode: string; cancelReason: string },
  ) {
    return await firstValueFrom(
      this.catalogClient.send(
        { cmd: 'cancel_payment' },
        { orderCode, cancelReason },
      ),
    );
  }
}
