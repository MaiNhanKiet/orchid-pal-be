import {
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_CLIENT_ID,
  MICROSERVICES_CLIENTS,
  DEFAULT_TIMEOUT_PAYMENT,
  QueueName,
} from '@app/common';
import {
  OrderStatus,
  TransactionStatus,
  ShipmentStatus,
} from '@app/common/enums';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentLink, PaymentLinkItem, PayOS, Webhook } from '@payos/node';
import { OrdersService } from '../orders/orders.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@app/prisma';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ClientProxy } from '@nestjs/microservices';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface PayOSPaymentLinkRequest {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
  items?: Array<{ name: string; price: number; quantity: number }>;
}

interface OrderSuccessEmailEvent {
  email: string;
  fullName?: string;
  orderCode: string;
  paymentMethod: 'COD' | 'PAYOS';
  totalAmount: number;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable()
export class PaymentService {
  private readonly payos: PayOS;
  private readonly transporter: Transporter;
  private readonly mailFrom: string;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectQueue(QueueName.PaymentTimeoutQueue) private paymentQueue: Queue,
    @Inject(MICROSERVICES_CLIENTS.API_GATEWAY)
    private readonly apiGatewayClient: ClientProxy,
  ) {
    const clientId = PAYOS_CLIENT_ID;
    const apiKey = PAYOS_API_KEY;
    const checksumKey = PAYOS_CHECKSUM_KEY;

    this.payos = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    this.mailFrom =
      this.configService.get<string>('MAIL_FROM') ||
      user ||
      'no-reply@orchidpal.local';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async createPaymentLink(data: PayOSPaymentLinkRequest) {
    const paymentLinkData = {
      orderCode: data.orderCode,
      amount: data.amount,
      description: data.description,
      items: data.items || [], // có thể thêm sau nếu cần chi tiết sản phẩm
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
    };

    const response = await this.payos.paymentRequests.create(paymentLinkData);

    return response;
  }

  async verifyWebhook(body: Webhook): Promise<boolean> {
    try {
      // PayOS webhook verification dựa trên checksum trong body
      // SDK sẽ throw error nếu không hợp lệ
      await this.payos.webhooks.verify(body);
      return true;
    } catch {
      return false;
    }
  }

  async getPaymentInformation(paymentLinkId: string) {
    try {
      const response = await this.payos.paymentRequests.get(paymentLinkId);
      return response;
    } catch (error) {
      console.error('Lỗi khi gọi PayOS cancel:', error);
      return null;
    }
  }

  async cancelPayment(
    orderCode: number,
    cancelReason?: string,
  ): Promise<boolean> {
    try {
      const response = await this.payos.paymentRequests.cancel(
        orderCode,
        cancelReason,
      );

      // Kiểm tra response thành công (theo docs PayOS, response sẽ có status nếu thành công)
      if (response && response.status === 'CANCELLED') {
        this.handlePayOSCancelOrFailed(orderCode.toString(), response.status);
        return true;
      }

      console.warn('PayOS cancel response không thành công:', response);
      return false;
    } catch (error) {
      console.error('Lỗi khi gọi PayOS cancel:', error);
      return false;
    }
  }

  async handleWebhook(body: Webhook) {
    console.log('handleWebhook', body);
    const valid = await this.verifyWebhook(body);

    if (!valid) {
      return { success: false, message: 'Invalid signature' };
    }

    // Type guard đơn giản
    if (
      typeof body === 'object' &&
      body !== null &&
      'code' in body &&
      'data' in body &&
      typeof (body as any).data === 'object' &&
      'orderCode' in (body as any).data
    ) {
      const typedBody = body as { code: string; data: { orderCode: number } };

      if (typedBody.code === '00') {
        await this.handlePayOSSuccess(typedBody.data.orderCode.toString());
      }
    }

    return { success: true };
  }

  async checkout(userId: string, dto: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lấy cart items được chọn
      const cartItems = await tx.cart_items.findMany({
        where: {
          user_id: userId,
          is_selected: true,
        },
        include: {
          products: true,
        },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException(
          'Không có sản phẩm nào được chọn trong giỏ hàng',
        );
      }

      // 2. Lấy địa chỉ giao hàng
      let address;
      if (dto.addressId) {
        address = await tx.user_addresses.findUnique({
          where: {
            id: dto.addressId,
            user_id: userId,
          },
        });
        if (!address) {
          throw new BadRequestException(
            'Địa chỉ không tồn tại hoặc không thuộc về bạn',
          );
        }
      } else {
        address = await tx.user_addresses.findFirst({
          where: {
            user_id: userId,
            is_default: true,
          },
        });

        if (!address) {
          address = await tx.user_addresses.findFirst({
            where: { user_id: userId },
          });
        }

        if (!address) {
          throw new BadRequestException(
            'Bạn chưa có địa chỉ giao hàng nào. Vui lòng thêm địa chỉ trước',
          );
        }
      }

      const shippingInfo = {
        recipient_name: address.recipient_name,
        phone: address.phone,
        full_address: address.full_address,
        street: address.street,
        ward: address.ward,
        district: address.district,
        city: address.city,
        address_id: address.id,
      } as const;

      // 3. Validate stock và tính tổng tiền
      let totalAmount = new Prisma.Decimal(0);
      const orderItemsData: Array<{
        product_id: string;
        product_name_snapshot: string;
        quantity: number;
        unit_price: Prisma.Decimal;
      }> = [];

      for (const item of cartItems) {
        const product = item.products;
        if (!product) {
          throw new BadRequestException(
            `Sản phẩm ${item.product_id} không tồn tại`,
          );
        }

        if (product.stock_quantity! < item.quantity!) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" không đủ hàng (chỉ còn ${product.stock_quantity})`,
          );
        }

        const unitPrice = product.price;
        const totalPrice = unitPrice.mul(item.quantity!);

        totalAmount = totalAmount.add(totalPrice);

        orderItemsData.push({
          product_id: item.product_id!,
          product_name_snapshot: product.name,
          quantity: item.quantity!,
          unit_price: unitPrice,
        });
      }

      // 4. Tạo order
      const orderCode = this.generateOrderCode();

      const order = await tx.orders.create({
        data: {
          user_id: userId,
          order_code: orderCode,
          total_amount: totalAmount,
          status: OrderStatus.PENDING,
          // payment_method: dto.paymentMethod,
          shipping_info: shippingInfo as Prisma.InputJsonValue,
          note: dto.note,
          order_items: {
            create: orderItemsData,
          },
        },
        include: {
          order_items: true,
        },
      });

      // 5. Xử lý theo phương thức thanh toán
      if (dto.paymentMethod === 'COD') {
        console.log('[COD] Xử lý COD cho orderCode:', orderCode);

        await tx.orders.update({
          where: { id: order.id },
          data: { status: OrderStatus.PENDING },
        });

        await tx.transactions.create({
          data: {
            order_id: order.id,
            user_id: userId,
            amount: totalAmount,
            method: 'COD',
            status: TransactionStatus.PENDING,
          },
        });

        // TẠO SHIPMENT NGAY CHO COD (Tạm thời)
        await tx.shipments.create({
          data: {
            order_id: order.id,
            carrier_name: 'GHTK', // hoặc lấy từ config, hoặc để user chọn sau
            tracking_code: null, // sẽ update sau khi giao cho đơn vị vận chuyển
            shipping_fee: new Prisma.Decimal(0), // ví dụ, có thể tính động sau
            status: ShipmentStatus.READY, // trạng thái ban đầu: đang chuẩn bị
            estimated_delivery_at: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ), // +3 ngày ví dụ
          },
        });

        for (const item of order.order_items) {
          await tx.products.update({
            where: { id: item.product_id! },
            data: { stock_quantity: { decrement: item.quantity! } },
          });
        }

        await tx.cart_items.deleteMany({
          where: { user_id: userId, is_selected: true },
        });

        this.eventEmitter.emit('order.confirmed', order);

        const user = await tx.users.findUnique({
          where: { id: userId },
          select: { email: true, full_name: true },
        });

        if (user?.email) {
          this.sendOrderSuccessEmail({
            email: user.email,
            fullName:
              user.full_name ?? shippingInfo.recipient_name ?? undefined,
            orderCode,
            paymentMethod: 'COD',
            totalAmount: Number(totalAmount),
            items: order.order_items.map((item) => ({
              name: item.product_name_snapshot,
              quantity: item.quantity,
              unitPrice: Number(item.unit_price),
            })),
          });
        }

        return {
          success: true,
          orderId: order.id,
          orderCode,
          status: OrderStatus.PENDING,
          paymentMethod: 'COD',
          totalAmount: Number(totalAmount),
          shippingInfo,
          items: order.order_items.map((item) => ({
            productName: item.product_name_snapshot,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            totalPrice: Number(
              item.total_price ?? Number(item.unit_price) * item.quantity,
            ),
          })),
        };
      }

      // PAYOS
      const payosPayload = {
        orderCode: Number(orderCode.replace(/\D/g, '')),
        amount: Number(totalAmount),
        description: orderCode,
        buyerName: shippingInfo.recipient_name ?? undefined,
        buyerPhone: shippingInfo.phone ?? undefined,
        returnUrl: `${process.env.FRONTEND_URL}/checkout/success?orderId=${order.id}`,
        cancelUrl: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order.id}`,
      };

      const payosResponse = await this.createPaymentLink(payosPayload);
      console.log('payosResponse', payosResponse);

      // await tx.orders.update({
      //   where: { id: order.id },
      //   data: {
      //     payment_link: payosResponse.checkoutUrl,
      //   },
      // });

      const createdTransaction = await tx.transactions.create({
        data: {
          order_id: order.id,
          user_id: userId,
          amount: totalAmount,
          method: 'PAYOS',
          status: TransactionStatus.PENDING,
          gateway_trans_id: payosResponse.orderCode.toString(),
          gateway_log: payosResponse,
        },
      });
      // Lấy id transaction sau khi insert (Prisma transaction không return nested creates dễ trong tx logic này)
      // const createdTransaction = await tx.transactions.findFirst({
      //   where: { order_id: order.id },
      //   orderBy: { paid_at: 'desc' }, // lấy cái vừa tạo
      // });

      if (createdTransaction) {
        await this.paymentQueue.add(
          'check_timeout',
          { transactionId: createdTransaction.id },
          { delay: DEFAULT_TIMEOUT_PAYMENT },
        );
      }

      const imageUrl = `https://img.vietqr.io/image/${payosResponse.bin}-${payosResponse.accountNumber}-vietqr_pro.jpg?addInfo=${payosResponse.description.replace(/\s/g, '+')}&amount=${payosResponse.amount}`;

      return {
        success: true,
        orderId: order.id,
        orderCode: payosResponse.orderCode.toString(),
        paymentUrl: payosResponse.checkoutUrl,
        status: 'PENDING',
        paymentMethod: 'PAYOS',
        totalAmount: Number(totalAmount),
        shippingInfo,
        qrCode: payosResponse.qrCode,
        paymentLinkId: payosResponse.paymentLinkId,
        imageUrl,
      };
    });
  }

  async handlePayOSSuccess(
    payosOrderCode: string,
  ): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transactions.findFirst({
        where: {
          method: 'PAYOS',
          gateway_trans_id: payosOrderCode,
          status: TransactionStatus.PENDING,
        },
        include: {
          orders: {
            include: {
              order_items: true,
            },
          },
        },
      });

      if (!transaction?.orders) {
        return { success: false };
      }

      const order = transaction.orders;

      await tx.orders.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      await tx.transactions.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.SUCCESS,
          paid_at: new Date(),
        },
      });

      // TẠO SHIPMENT SAU KHI THANH TOÁN THÀNH CÔNG (Tạm thời)
      await tx.shipments.create({
        data: {
          order_id: order.id,
          carrier_name: 'GHTK', // có thể lấy từ config hoặc logic tự động chọn nhà vận chuyển
          tracking_code: null, // sẽ update sau
          shipping_fee: new Prisma.Decimal(30000), // tính động dựa trên địa chỉ, trọng lượng...
          status: ShipmentStatus.READY, // trạng thái chờ xác nhận vận chuyển
          estimated_delivery_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 ngày
        },
      });

      const productIds = order.order_items.map((item) => item.product_id!);

      for (const item of order.order_items) {
        await tx.products.update({
          where: { id: item.product_id! },
          data: { stock_quantity: { decrement: item.quantity! } },
        });
      }

      await tx.cart_items.deleteMany({
        where: {
          user_id: order.user_id!,
          product_id: { in: productIds },
        },
      });

      this.eventEmitter.emit('order.paid', order);

      const user = await tx.users.findUnique({
        where: { id: order.user_id! },
        select: { email: true, full_name: true },
      });

      if (user?.email) {
        this.sendOrderSuccessEmail({
          email: user.email,
          fullName: user.full_name ?? undefined,
          orderCode: order.order_code,
          paymentMethod: 'PAYOS',
          totalAmount: Number(order.total_amount),
          items: order.order_items.map((item) => ({
            name: item.product_name_snapshot,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
          })),
        });
      }

      this.apiGatewayClient.emit('payment_status_updated', {
        orderCode: order.order_code,
        orderId: order.id,
        status: 'PAID',
        message: 'Thanh toán thành công',
        paymentMethod: 'PAYOS',
        totalAmount: Number(order.total_amount),
        items: order.order_items.map((item) => ({
          productName: item.product_name_snapshot,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(
            item.total_price ?? item.unit_price.mul(item.quantity),
          ),
        })),
        shippingInfo: order.shipping_info,
      });

      return { success: true };
    });
  }

  async handlePayOSCancelOrFailed(
    payosOrderCode: string,
    payosStatus: string,
    description?: string,
  ): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transactions.findFirst({
        where: {
          method: 'PAYOS',
          gateway_trans_id: payosOrderCode,
          status: TransactionStatus.PENDING, // chỉ xử lý nếu vẫn đang pending
        },
        include: {
          orders: true,
        },
      });

      if (!transaction?.orders) {
        console.warn(
          `Không tìm thấy transaction cho PayOS orderCode: ${payosOrderCode}`,
        );
        return {
          success: false,
          message: `Không tìm thấy transaction cho PayOS orderCode: ${payosOrderCode}`,
        };
      }

      const order = transaction.orders;

      // Cập nhật order → CANCELLED hoặc FAILED
      // Bạn có thể phân biệt: nếu code là "08" hoặc chứa "cancel" thì CANCELLED, còn lại FAILED
      const newOrderStatus = payosStatus; // điều chỉnh theo thực tế

      await tx.orders.update({
        where: { id: order.id },
        data: {
          status:
            newOrderStatus === 'CANCELLED'
              ? OrderStatus.CANCELLED
              : OrderStatus.PENDING,
          // optional: cancelled_at: new Date(),
          // cancelled_reason: `PayOS: ${payosCode} - ${description || 'Unknown'}`,
        },
      });

      await tx.transactions.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED, // hoặc 'CANCELLED' nếu bạn muốn phân biệt
        },
      });

      // Emit event nếu cần thông báo user hoặc admin
      this.eventEmitter.emit('order.cancelled', {
        order,
        reason: `PayOS webhook: status ${payosStatus} - ${description || 'No description'}`,
      });

      this.apiGatewayClient.emit('payment_status_updated', {
        orderCode: order.order_code,
        status: 'FAILED',
        message: `Thanh toán thất bại hoặc đã hủy: ${payosStatus}`,
      });

      console.log(
        `Order ${order.order_code} đã được xử lý cancel/failed từ PayOS (status: ${payosStatus})`,
      );

      return {
        success: true,
        message: `Order ${order.order_code} đã được xử lý cancel/failed từ PayOS (status: ${payosStatus})`,
      };
    });
  }

  async handleTimeoutPayment(transactionId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transactions.findUnique({
        where: { id: transactionId },
        include: { orders: true },
      });

      if (!transaction || transaction.status !== TransactionStatus.PENDING) {
        // Có thể user đã thanh toán thành công, transaction không còn PENDING -> bỏ qua
        return;
      }

      const order = transaction.orders;
      if (!order || order.status !== OrderStatus.PENDING) {
        return;
      }

      // 1. Cập nhật trạng thái
      await tx.orders.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      await tx.transactions.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.FAILED,
        },
      });

      // 2. Có thể gọi cancel link bên PayOS để vô hiệu hóa mã QR cũ
      if (transaction.gateway_trans_id) {
        try {
          await this.payos.paymentRequests.cancel(
            Number(transaction.gateway_trans_id),
            'Timeout quá 15 phút',
          );
        } catch (error) {
          console.warn(
            `Không thể huỷ PayOS link cho order ${transaction.gateway_trans_id}`,
            error,
          );
        }
      }

      // 3. Emit event SSE để frontend biết nếu đang đợi
      this.apiGatewayClient.emit('payment_status_updated', {
        orderCode: order.order_code,
        status: 'FAILED',
        message: 'Thanh toán quá hạn 15 phút',
      });

      console.log(`[Timeout] Đã tự động hủy đơn hàng ${order.order_code}`);
    });
  }

  private generateOrderCode(): string {
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-7 chữ số
    return shortCode;
  }

  private sendOrderSuccessEmail(payload: OrderSuccessEmailEvent): void {
    const customerName = payload.fullName || 'bạn';
    const totalAmountFormatted = new Intl.NumberFormat('vi-VN').format(
      payload.totalAmount,
    );
    const paymentMethodText =
      payload.paymentMethod === 'PAYOS'
        ? 'PayOS (chuyển khoản)'
        : 'Thanh toán khi nhận hàng (COD)';
    const emailHeadline =
      payload.paymentMethod === 'PAYOS'
        ? 'Đơn hàng của bạn đã được thanh toán thành công'
        : 'Đơn hàng của bạn đã được đặt thành công';
    const emailIntro =
      payload.paymentMethod === 'PAYOS'
        ? 'Cảm ơn bạn đã thanh toán qua PayOS. Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị để giao sớm nhất có thể.'
        : 'Cảm ơn bạn đã đặt hàng tại OrchidPal. Đơn hàng của bạn đã được ghi nhận và đang được xử lý.';
    const itemRows = (payload.items || [])
      .map((item) => {
        const unitPrice = new Intl.NumberFormat('vi-VN').format(item.unitPrice);
        const lineTotal = new Intl.NumberFormat('vi-VN').format(
          item.unitPrice * item.quantity,
        );
        return `
          <tr>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;">${item.name}</td>
            <td align="center" style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;">${item.quantity}</td>
            <td align="right" style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;">${unitPrice} VND</td>
            <td align="right" style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#111827;">${lineTotal} VND</td>
          </tr>
        `;
      })
      .join('');
    const productSection = itemRows
      ? `
          <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th align="left" style="padding:10px 8px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Sản phẩm</th>
                  <th align="center" style="padding:10px 8px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Số lượng</th>
                  <th align="right" style="padding:10px 8px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Đơn giá</th>
                  <th align="right" style="padding:10px 8px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </div>
        `
      : '';

    void this.transporter
      .sendMail({
        from: this.mailFrom,
        to: payload.email,
        subject: `[OrchidPal] Đặt hàng thành công - Đơn ${payload.orderCode}`,
        html: `
          <div style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
              <div style="padding:20px 24px;background:linear-gradient(135deg,#0f766e,#065f46);color:#ffffff;">
                <h1 style="margin:0;font-size:20px;line-height:1.4;">OrchidPal</h1>
                <p style="margin:8px 0 0;font-size:13px;opacity:.95;">${emailHeadline}</p>
              </div>

              <div style="padding:24px;">
                <p style="margin:0 0 14px;font-size:15px;">Xin chào <strong>${customerName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#374151;">
                  ${emailIntro}
                </p>

                <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#fafafa;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Mã đơn hàng</td>
                      <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#111827;">${payload.orderCode}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Phương thức thanh toán</td>
                      <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#111827;">${paymentMethodText}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Tổng thanh toán</td>
                      <td align="right" style="padding:6px 0;font-size:15px;font-weight:800;color:#065f46;">${totalAmountFormatted} VND</td>
                    </tr>
                  </table>
                </div>

                ${productSection}

                <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">
                  Nếu bạn cần hỗ trợ, vui lòng liên hệ đội ngũ OrchidPal. Cảm ơn bạn đã tin tưởng!
                </p>
              </div>
            </div>
          </div>
        `,
      })
      .then(() => {
        console.log(
          `[PaymentService] Sent order success email to ${payload.email} for order ${payload.orderCode}`,
        );
      })
      .catch((error) => {
        console.error(
          `[PaymentService] Failed to send order success email for order ${payload.orderCode}:`,
          error,
        );
      });
  }
}
