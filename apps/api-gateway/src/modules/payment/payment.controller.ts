import { Body, Controller, Inject, Param, Post, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  UuidDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { Public } from '@app/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  firstValueFrom,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  startWith,
} from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiCancelPaymentDocs,
  ApiCheckOutDocs,
  ApiGetPaymentInformationDocs,
  ApiHandlePayOSWebhookDocs,
} from './payment.swagger';

import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';
import { BypassInterceptors } from '@app/common/decorators/bypass-interceptors.decorator';

@ApiTags('07 - Payment')
@ApiBearerAuth('access-token')
@Controller('payment')
// @Public()
export class PaymentController {
  constructor(
    private readonly grpcRpc: GrpcRpcService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('/webhooks/payos')
  @Public()
  @ApiHandlePayOSWebhookDocs()
  async handlePayOS(@Body() body: any) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'handle_webhook', { body });
  }

  @Post('/check-out')
  // @Permissions(Permission.OrderCreate)
  @ApiCheckOutDocs()
  async checkOut(
    @CurrentUser() user: JwtPayload,
    @Body() checkOutDto: CheckoutDto,
  ) {
    const id: UuidDto = { id: user.sub };

    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'check_out', { id, checkOutDto });
  }

  @Post('/cancel-payment')
  // @Permissions(Permission.OrderCreate)
  @ApiCancelPaymentDocs()
  async cancelPayment(
    @Body()
    { orderCode, cancelReason }: { orderCode: string; cancelReason: string },
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'cancel_payment', { orderCode, cancelReason });
  }

  @Post('/get-payment-information')
  // @Permissions(Permission.OrderCreate)
  @ApiGetPaymentInformationDocs()
  async getPaymentInformation(
    @Param()
    { paymentLinkId }: { paymentLinkId: string },
  ) {
    return await this.grpcRpc.send(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE, 'get_payment_information', { paymentLinkId });
  }

  @EventPattern('payment_status_updated') // NÊN DÙNG EventPattern thay vì MessagePattern cho các luồng thông báo 1 chiều
  handlePaymentStatusFromRMQ(
    @Payload() data: { orderCode: string; status: string; message: string },
    @Ctx() context: RmqContext, // Phải có context để báo RMQ xoá tin nhắn
  ) {
    console.log(
      `[API Gateway] Nhận update thanh toán RMQ cho đơn: ${data.orderCode}`,
      data,
    );

    // Phát event nội bộ trong API Gateway để SSE client bắt được
    this.eventEmitter.emit(`payment.update.${data.orderCode}`, data);

    // Xác nhận (Ack) với RabbitMQ để tránh kẹt Queue (Giống hệt luồng Telemetry của bạn)
    const channel = context.getChannelRef();
    channel.ack(context.getMessage());
  }

  @Sse('/sse/:orderCode')
  @Public()
  @BypassInterceptors() // QUAN TRỌNG NHẤT: Bỏ qua Timeout 5s và Transform JSON
  ssePaymentStatus(
    @Param('orderCode') orderCode: string,
  ): Observable<MessageEvent> {
    console.log(`[API Gateway] Mở SSE cho đơn ${orderCode}`);

    const payment$ = fromEvent(
      this.eventEmitter,
      `payment.update.${orderCode}`,
    ).pipe(
      map((data) => {
        return { data: data } as MessageEvent;
      }),
    );

    const heartbeat$ = interval(15000).pipe(
      startWith(0),
      map(
        () =>
          ({
            data: { type: 'ping', status: 'waiting_for_payment' },
          }) as MessageEvent,
      ),
    );

    // Gộp cả 2 luồng trả về cho FE
    return merge(payment$, heartbeat$);
  }
}
