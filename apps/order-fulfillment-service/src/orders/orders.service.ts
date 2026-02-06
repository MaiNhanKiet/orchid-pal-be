import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { CreateCartItemDto } from '@app/common/dtos/catalog/cart.dto';
import { CheckoutDto } from '@app/common/dtos/payment/checkout.dto';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayOSService } from '../payos/payos.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private payosService: PayOSService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAllOrders() {
    return this.prisma.orders.findMany();
  }

  async getOrdersByUserId(
    userId: string,
    { page, limit }: { page?: number; limit?: number },
  ) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;
    const orders = await this.prisma.orders.findMany({
      where: {
        user_id: userId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return orders;
  }

  async getOrderById(id: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    return order;
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
        total_price: Prisma.Decimal;
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
          total_price: totalPrice,
        });

        await tx.products.update({
          where: { id: item.product_id! },
          data: { stock_quantity: { decrement: item.quantity! } },
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
        description: `Thanh toán đơn hàng ${orderCode}`,
        buyerName: shippingInfo.recipient_name ?? undefined,
        buyerPhone: shippingInfo.phone ?? undefined,
        returnUrl: `${process.env.FRONTEND_URL}/checkout/success?orderId=${order.id}`,
        cancelUrl: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order.id}`,
      };

      const payosResponse =
        await this.payosService.createPaymentLink(payosPayload);

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

      const productIds = order.order_items.map((item) => item.product_id!);

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

  private generateOrderCode(): string {
    return `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
