import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  OrderStatus,
  ReturnRequestStatus,
  TransactionStatus,
} from '@app/common/enums';
import { CreateReturnRequestDto, RejectReturnRequestDto } from '@app/common';
import { GhnService } from '../shipments/ghn.service';

@Injectable()
export class RefundReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ghnService: GhnService,
  ) {}

  /**
   * User gửi yêu cầu trả hàng.
   * Chỉ cho phép với đơn COMPLETED.
   */
  async requestReturn(userId: string, dto: CreateReturnRequestDto) {
    const order = await this.prisma.orders.findUnique({
      where: { id: dto.orderId },
      include: { transactions: { orderBy: { paid_at: 'desc' }, take: 1 } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên đơn hàng này',
      );
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        `Chỉ có thể yêu cầu trả hàng với đơn ở trạng thái COMPLETED (hiện tại: ${order.status})`,
      );
    }

    // Kiểm tra chưa có return request đang pending/approved
    const existing = await this.prisma.return_requests.findFirst({
      where: {
        order_id: dto.orderId,
        status: {
          in: [ReturnRequestStatus.PENDING, ReturnRequestStatus.APPROVED],
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Đơn hàng này đã có yêu cầu trả hàng đang xử lý',
      );
    }

    // Validate: nếu COD thì bắt buộc phải có refund_bank_info
    const transaction = order.transactions[0];
    if (transaction?.method === 'COD' && !dto.refund_bank_info) {
      throw new BadRequestException(
        'Đơn COD cần cung cấp thông tin tài khoản ngân hàng để hoàn tiền',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const returnRequest = await tx.return_requests.create({
        data: {
          order_id: dto.orderId,
          user_id: userId,
          reason: dto.reason,
          images: dto.images ?? [],
          refund_bank_info: dto.refund_bank_info
            ? JSON.parse(JSON.stringify(dto.refund_bank_info))
            : null,
          status: ReturnRequestStatus.PENDING,
        },
      });

      await tx.orders.update({
        where: { id: dto.orderId },
        data: { status: OrderStatus.RETURN_REQUESTED },
      });

      return {
        message: 'Yêu cầu trả hàng đã được gửi thành công',
        returnRequestId: returnRequest.id,
        status: returnRequest.status,
      };
    });
  }

  /**
   * Manager approve return request.
   * Hủy đơn GHN + chuyển trạng thái sang RETURNING / REFUNDING.
   */
  async approveReturn(returnRequestId: string) {
    const returnRequest = await this.prisma.return_requests.findUnique({
      where: { id: returnRequestId },
      include: {
        orders: {
          include: {
            shipments: { orderBy: { created_at: 'desc' }, take: 1 },
            transactions: { orderBy: { paid_at: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!returnRequest) {
      throw new NotFoundException('Không tìm thấy return request');
    }

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      throw new BadRequestException(
        `Return request đã được xử lý (status: ${returnRequest.status})`,
      );
    }

    const order = returnRequest.orders;
    if (order.status !== OrderStatus.RETURN_REQUESTED) {
      throw new BadRequestException(
        `Đơn hàng không ở trạng thái RETURN_REQUESTED (hiện tại: ${order.status})`,
      );
    }

    // Hủy đơn GHN nếu có tracking_code
    // Đối với đơn đã COMPLETED, không thể gọi cancelShippingOrder. Đơn lấy chiều ngược lại phải được shop tự tạo thủ công trên hệ thống vận chuyển GHN.
    const shipment = order.shipments[0];
    if (shipment?.tracking_code) {
      console.log(
        `[RefundReturn] Đã duyệt request trả hàng cho đơn ${order.id}. Shop sẽ tự thao tác tạo đơn trên hệ thống GHN để lấy hàng chiều ngược lại.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.return_requests.update({
        where: { id: returnRequestId },
        data: {
          status: ReturnRequestStatus.APPROVED,
          resolved_at: new Date(),
        },
      });

      await tx.orders.update({
        where: { id: order.id },
        data: { status: OrderStatus.RETURNING },
      });

      const transaction = order.transactions[0];
      if (transaction) {
        await tx.transactions.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.REFUNDING },
        });
      }

      return {
        message: 'Đã phê duyệt yêu cầu trả hàng. Đang chờ shipper lấy hàng về.',
        returnRequestId,
        orderStatus: OrderStatus.RETURNING,
        transactionStatus: TransactionStatus.REFUNDING,
        refundBankInfo: returnRequest.refund_bank_info,
      };
    });
  }

  /**
   * Manager từ chối return request.
   */
  async rejectReturn(returnRequestId: string, dto: RejectReturnRequestDto) {
    const returnRequest = await this.prisma.return_requests.findUnique({
      where: { id: returnRequestId },
      include: { orders: true },
    });

    if (!returnRequest) {
      throw new NotFoundException('Không tìm thấy return request');
    }

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      throw new BadRequestException(
        `Return request đã được xử lý (status: ${returnRequest.status})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.return_requests.update({
        where: { id: returnRequestId },
        data: {
          status: ReturnRequestStatus.REJECTED,
          note: dto.note,
          resolved_at: new Date(),
        },
      });

      await tx.orders.update({
        where: { id: returnRequest.order_id },
        data: { status: OrderStatus.COMPLETED },
      });

      return {
        message: 'Đã từ chối yêu cầu trả hàng',
        returnRequestId,
        note: dto.note,
      };
    });
  }

  /**
   * Manager xác nhận đã nhận hàng về kho.
   * Order: RETURNING → RETURNED
   */
  async confirmReceived(returnRequestId: string) {
    const returnRequest = await this.prisma.return_requests.findUnique({
      where: { id: returnRequestId },
      include: { orders: true },
    });

    if (!returnRequest) {
      throw new NotFoundException('Không tìm thấy return request');
    }

    if (returnRequest.status !== ReturnRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Return request chưa được approve hoặc đã hoàn tất',
      );
    }

    if (returnRequest.orders.status !== OrderStatus.RETURNING) {
      throw new BadRequestException(
        `Đơn hàng không ở trạng thái RETURNING (hiện tại: ${returnRequest.orders.status})`,
      );
    }

    await this.prisma.orders.update({
      where: { id: returnRequest.order_id },
      data: { status: OrderStatus.RETURNED },
    });

    return {
      message: 'Đã xác nhận nhận hàng về kho',
      returnRequestId,
      orderStatus: OrderStatus.RETURNED,
    };
  }

  /**
   * Manager xác nhận đã chuyển tiền hoàn cho khách.
   * Transaction: REFUNDING → REFUNDED
   */
  async confirmRefunded(returnRequestId: string) {
    const returnRequest = await this.prisma.return_requests.findUnique({
      where: { id: returnRequestId },
      include: {
        orders: {
          include: {
            transactions: { orderBy: { paid_at: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!returnRequest) {
      throw new NotFoundException('Không tìm thấy return request');
    }

    if (returnRequest.status !== ReturnRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Return request chưa được approve hoặc đã hoàn tất',
      );
    }

    const transaction = returnRequest.orders.transactions[0];

    if (!transaction || transaction.status !== TransactionStatus.REFUNDING) {
      throw new BadRequestException(
        'Không tìm thấy transaction ở trạng thái REFUNDING',
      );
    }

    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.REFUNDED },
    });

    return {
      message: 'Đã xác nhận hoàn tiền thành công',
      returnRequestId,
      transactionStatus: TransactionStatus.REFUNDED,
      refundBankInfo: returnRequest.refund_bank_info,
    };
  }

  /**
   * Lấy tất cả return requests (manager).
   */
  async getAllReturnRequests(status?: string) {
    return this.prisma.return_requests.findMany({
      where: status ? { status } : undefined,
      include: {
        orders: {
          select: { order_code: true, total_amount: true, status: true },
        },
        users: { select: { full_name: true, email: true, phone: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Lấy return requests của user hiện tại.
   */
  async getMyReturnRequests(userId: string) {
    return this.prisma.return_requests.findMany({
      where: { user_id: userId },
      include: {
        orders: {
          select: { order_code: true, total_amount: true, status: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
