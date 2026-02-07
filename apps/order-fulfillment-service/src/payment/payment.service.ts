import {
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_CLIENT_ID,
} from '@app/common';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentLinkItem, PayOS, Webhook } from '@payos/node';
import { OrdersService } from '../orders/orders.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@app/prisma';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';
import { Prisma } from '@prisma/client';

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
export class PaymentService {
  private readonly payos: PayOS;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
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
        this.handlePayOSCancelOrFailed(orderCode.toString(), response.status)
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
        // total_price: Prisma.Decimal;
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
          // total_price: totalPrice,
        });
      }

      // 4. Tạo order
      const orderCode = this.generateOrderCode();

      const order = await tx.orders.create({
        data: {
          user_id: userId,
          order_code: orderCode,
          total_amount: totalAmount,
          status: 'PENDING',
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
        await tx.orders.update({
          where: { id: order.id },
          data: { status: 'CONFIRMED' },
        });

        await tx.transactions.create({
          data: {
            order_id: order.id,
            user_id: userId,
            amount: totalAmount,
            method: 'COD',
            status: 'PENDING_COD',
          },
        });

        // TẠO SHIPMENT NGAY CHO COD (Tạm thời)
        await tx.shipments.create({
          data: {
            order_id: order.id,
            carrier_name: 'GHTK', // hoặc lấy từ config, hoặc để user chọn sau
            tracking_code: null, // sẽ update sau khi giao cho đơn vị vận chuyển
            shipping_fee: new Prisma.Decimal(30000), // ví dụ, có thể tính động sau
            status: 'PROCESSING', // trạng thái ban đầu: đang chuẩn bị
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

        return {
          success: true,
          orderId: order.id,
          orderCode,
          status: 'CONFIRMED',
          paymentMethod: 'COD',
          totalAmount: Number(totalAmount),
          shippingInfo,
        };
      }

      // PAYOS
      const payosPayload = {
        orderCode: Number(orderCode.replace(/\D/g, '')),
        amount: Number(totalAmount),
        description: `Đơn hàng ${orderCode}`,
        buyerName: shippingInfo.recipient_name ?? undefined,
        buyerPhone: shippingInfo.phone ?? undefined,
        returnUrl: `${process.env.FRONTEND_URL}/checkout/success?orderId=${order.id}`,
        cancelUrl: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order.id}`,
      };

      const payosResponse = await this.createPaymentLink(payosPayload);

      // await tx.orders.update({
      //   where: { id: order.id },
      //   data: {
      //     payment_link: payosResponse.checkoutUrl,
      //   },
      // });

      await tx.transactions.create({
        data: {
          order_id: order.id,
          user_id: userId,
          amount: totalAmount,
          method: 'PAYOS',
          status: 'PENDING',
          gateway_trans_id: payosResponse.orderCode.toString(),
          gateway_log: payosResponse,
        },
      });

      return {
        success: true,
        orderId: order.id,
        orderCode,
        paymentUrl: payosResponse.checkoutUrl,
        status: 'PENDING',
        paymentMethod: 'PAYOS',
        totalAmount: Number(totalAmount),
        shippingInfo,
        qrCode: payosResponse.qrCode,
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
          status: 'PENDING',
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
        data: { status: 'PAID' },
      });

      await tx.transactions.update({
        where: { id: transaction.id },
        data: {
          status: 'PAID',
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
          status: 'PENDING', // trạng thái chờ xác nhận vận chuyển
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
          status: 'PENDING', // chỉ xử lý nếu vẫn đang pending
        },
        include: {
          orders: true,
        },
      });

      if (!transaction?.orders) {
        console.warn(
          `Không tìm thấy transaction cho PayOS orderCode: ${payosOrderCode}`,
        );
        return { success: false };
      }

      const order = transaction.orders;

      // Cập nhật order → CANCELLED hoặc FAILED
      // Bạn có thể phân biệt: nếu code là "08" hoặc chứa "cancel" thì CANCELLED, còn lại FAILED
      const newOrderStatus = payosStatus; // điều chỉnh theo thực tế

      await tx.orders.update({
        where: { id: order.id },
        data: {
          status: newOrderStatus,
          // optional: cancelled_at: new Date(),
          // cancelled_reason: `PayOS: ${payosCode} - ${description || 'Unknown'}`,
        },
      });

      await tx.transactions.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED', // hoặc 'CANCELLED' nếu bạn muốn phân biệt
        },
      });

      // Emit event nếu cần thông báo user hoặc admin
      this.eventEmitter.emit('order.cancelled', {
        order,
        reason: `PayOS webhook: status ${payosStatus} - ${description || 'No description'}`,
      });

      console.log(
        `Order ${order.order_code} đã được xử lý cancel/failed từ PayOS (status: ${payosStatus})`,
      );

      return { success: true };
    });
  }

  private generateOrderCode(): string {
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-7 chữ số
    return `ORD${shortCode}`;
  }
}
