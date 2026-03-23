import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RefundReturnService } from './refund-return.service';
import {
  CreateReturnRequestDto,
  RejectReturnRequestDto,
} from '@app/common';

@Controller()
export class RefundReturnController {
  constructor(private readonly refundReturnService: RefundReturnService) {}

  @MessagePattern({ cmd: 'request_return' })
  requestReturn(
    @Payload() { userId, dto }: { userId: string; dto: CreateReturnRequestDto },
  ) {
    return this.refundReturnService.requestReturn(userId, dto);
  }

  @MessagePattern({ cmd: 'approve_return' })
  approveReturn(@Payload() { returnRequestId }: { returnRequestId: string }) {
    return this.refundReturnService.approveReturn(returnRequestId);
  }

  @MessagePattern({ cmd: 'reject_return' })
  rejectReturn(
    @Payload()
    { returnRequestId, dto }: { returnRequestId: string; dto: RejectReturnRequestDto },
  ) {
    return this.refundReturnService.rejectReturn(returnRequestId, dto);
  }

  @MessagePattern({ cmd: 'confirm_received' })
  confirmReceived(@Payload() { returnRequestId }: { returnRequestId: string }) {
    return this.refundReturnService.confirmReceived(returnRequestId);
  }

  @MessagePattern({ cmd: 'confirm_refunded' })
  confirmRefunded(@Payload() { returnRequestId }: { returnRequestId: string }) {
    return this.refundReturnService.confirmRefunded(returnRequestId);
  }

  @MessagePattern({ cmd: 'get_all_return_requests' })
  getAllReturnRequests(@Payload() { status }: { status?: string }) {
    return this.refundReturnService.getAllReturnRequests(status);
  }

  @MessagePattern({ cmd: 'get_my_return_requests' })
  getMyReturnRequests(@Payload() { userId }: { userId: string }) {
    return this.refundReturnService.getMyReturnRequests(userId);
  }
}
