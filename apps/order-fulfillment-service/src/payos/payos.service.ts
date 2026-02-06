import {
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_CLIENT_ID,
} from '@app/common';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentLinkItem, PayOS, Webhook } from '@payos/node';
import { OrdersService } from '../orders/orders.service';

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

@Injectable()
export class PayOSService {
  private readonly payos: PayOS;

  constructor(
    @Inject(forwardRef(() => OrdersService))
    private orderService: OrdersService,
  ) {
    const clientId = PAYOS_CLIENT_ID;
    const apiKey = PAYOS_API_KEY;
    const checksumKey = PAYOS_CHECKSUM_KEY;

    this.payos = new PayOS({
      clientId,
      apiKey,
      checksumKey,
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

    return {
      checkoutUrl: response.checkoutUrl,
      orderCode: response.orderCode,
      qrCode: response.qrCode,
    };
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
        // hoặc kiểm tra theo docs chính thức
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
        await this.orderService.handlePayOSSuccess(
          typedBody.data.orderCode.toString(),
        );
      }
    }

    return { success: true };
  }
}
