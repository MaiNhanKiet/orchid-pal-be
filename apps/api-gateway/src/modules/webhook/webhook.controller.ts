import { Body, Controller, Inject, Post } from '@nestjs/common';
import { MICROSERVICES_CLIENTS } from '@app/common';

import { Public } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { type Webhook } from '@payos/node';

@ApiBearerAuth('access-token')
@Controller('webhooks')
@Public()
export class WebhookController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly catalogClient: ClientProxy,
  ) {}

  @Post('payos')
  @Public()
  async handlePayOS(@Body() body: Webhook) {
    return await firstValueFrom(
      this.catalogClient.send({ cmd: 'handle_webhook' }, { body }),
    );
  }
}
