import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, JwtPayload, MICROSERVICES_CLIENTS } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateReturnRequestDto, RejectReturnRequestDto } from '@app/common';
import {
  ApiApproveReturnDocs,
  ApiConfirmReceivedDocs,
  ApiConfirmRefundedDocs,
  ApiGetAllReturnRequestsDocs,
  ApiGetMyReturnRequestsDocs,
  ApiRejectReturnDocs,
  ApiRequestReturnDocs,
} from './refund-return.swagger';

@ApiTags('Refund & Return')
@ApiBearerAuth('access-token')
@Controller('refund-returns')
export class RefundReturnGatewayController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE)
    private readonly orderFulfillmentClient: ClientProxy,
  ) {}

  /**
   * User gửi yêu cầu trả hàng
   */
  @Post('/request')
  @ApiRequestReturnDocs()
  async requestReturn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'request_return' },
        { userId: user.sub, dto },
      ),
    );
  }

  /**
   * Manager approve return request → hủy GHN, Order→RETURNING, Tx→REFUNDING
   */
  @Post('/:id/approve')
  @ApiApproveReturnDocs()
  async approveReturn(@Param('id') returnRequestId: string) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'approve_return' },
        { returnRequestId },
      ),
    );
  }

  /**
   * Manager từ chối return request → Order→COMPLETED
   */
  @Post('/:id/reject')
  @ApiRejectReturnDocs()
  async rejectReturn(
    @Param('id') returnRequestId: string,
    @Body() dto: RejectReturnRequestDto,
  ) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'reject_return' },
        { returnRequestId, dto },
      ),
    );
  }

  /**
   * Manager xác nhận đã nhận hàng về kho → Order→RETURNED
   */
  @Post('/:id/confirm-received')
  @ApiConfirmReceivedDocs()
  async confirmReceived(@Param('id') returnRequestId: string) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'confirm_received' },
        { returnRequestId },
      ),
    );
  }

  /**
   * Manager xác nhận đã chuyển tiền hoàn → Tx→REFUNDED
   */
  @Post('/:id/confirm-refunded')
  @ApiConfirmRefundedDocs()
  async confirmRefunded(@Param('id') returnRequestId: string) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'confirm_refunded' },
        { returnRequestId },
      ),
    );
  }

  /**
   * Manager xem tất cả return requests
   */
  @Get('/')
  @ApiGetAllReturnRequestsDocs()
  async getAllReturnRequests(@Query('status') status?: string) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_all_return_requests' },
        { status },
      ),
    );
  }

  /**
   * User xem return requests của mình
   */
  @Get('/me')
  @ApiGetMyReturnRequestsDocs()
  async getMyReturnRequests(@CurrentUser() user: JwtPayload) {
    return await firstValueFrom(
      this.orderFulfillmentClient.send(
        { cmd: 'get_my_return_requests' },
        { userId: user.sub },
      ),
    );
  }
}
