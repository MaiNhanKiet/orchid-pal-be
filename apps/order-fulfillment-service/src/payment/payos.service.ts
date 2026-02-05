import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS, Webhook } from '@payos/node';

interface PayOSPaymentLinkRequest {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
}

@Injectable()
export class PayOSService {
  private readonly payos: PayOS;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.getOrThrow<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.getOrThrow<string>('PAYOS_API_KEY');
    const checksumKey =
      this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY');

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
      items: [], // có thể thêm sau nếu cần chi tiết sản phẩm
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
}
