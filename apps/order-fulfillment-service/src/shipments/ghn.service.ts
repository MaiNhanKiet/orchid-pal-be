import { Injectable } from '@nestjs/common';

interface GhnCreateOrderPayload {
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  weight: number;
  service_type_id: number;
  payment_type_id: number; // 1 = shop trả phí, 2 = người nhận trả
  cod_amount?: number;
  note?: string;
  items?: Array<{ name: string; quantity: number; weight: number }>;
}

@Injectable()
export class GhnService {
  private readonly apiUrl = process.env.GHN_API_URL;
  private readonly token = process.env.GHN_TOKEN;
  private readonly shopId = process.env.GHN_SHOP_ID;

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Token: this.token,
      ShopId: this.shopId,
    };
  }

  /**
   * Tạo đơn vận chuyển GHN.
   * Trả về GHN order_code để lưu làm tracking_code.
   */
  async createShippingOrder(
    payload: GhnCreateOrderPayload,
  ): Promise<{ order_code: string; expected_delivery_time: string } | null> {
    try {
      const url = `${this.apiUrl}/shipping-order/create`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.code === 200 && data.data?.order_code) {
        return {
          order_code: data.data.order_code,
          expected_delivery_time: data.data.expected_delivery_time,
        };
      }

      console.warn('[GHN] createShippingOrder thất bại:', data);
      return null;
    } catch (error) {
      console.error('[GHN] Lỗi khi tạo đơn:', error);
      return null;
    }
  }

  /**
   * Hủy đơn vận chuyển GHN.
   * Dùng khi manager approve return request.
   */
  async cancelShippingOrder(orderCode: string): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/switch-status/cancel`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ order_codes: [orderCode] }),
      });
      const data = await response.json();

      if (data.code === 200) {
        return true;
      }

      console.warn('[GHN] cancelShippingOrder thất bại:', data);
      return false;
    } catch (error) {
      console.error('[GHN] Lỗi khi hủy đơn:', error);
      return false;
    }
  }

  /**
   * Lấy thông tin trạng thái đơn GHN.
   */
  async getOrderStatus(orderCode: string): Promise<string | null> {
    try {
      const url = `${this.apiUrl}/shipping-order/detail`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...this.headers, order_code: orderCode },
      });
      const data = await response.json();

      if (data.code === 200 && data.data?.status) {
        return data.data.status;
      }
      return null;
    } catch (error) {
      console.error('[GHN] Lỗi khi lấy trạng thái đơn:', error);
      return null;
    }
  }
}
