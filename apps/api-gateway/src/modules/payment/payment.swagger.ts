import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiHandlePayOSWebhookDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Nhận webhook từ PayOS (Public)' }),
    ApiBody({
      description: 'Webhook payload từ PayOS',
      schema: {
        example: {
          code: '00',
          desc: 'Thanh toán thành công',
          data: {
            orderCode: 123456,
            amount: 2750000,
            description: 'Thanh toan don hang ORD20240101001',
            accountNumber: '12345678',
            reference: 'TXN_REF_001',
            transactionDateTime: '2024-01-01 10:00:00',
            currency: 'VND',
            paymentLinkId: 'paylink-001',
            code: '00',
            desc: 'Thanh toán thành công',
            counterAccountBankId: null,
            counterAccountBankName: null,
            counterAccountName: null,
            counterAccountNumber: null,
            virtualAccountName: null,
            virtualAccountNumber: null,
          },
          signature: 'abc123signature',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook xử lý thành công',
      schema: { example: { success: true } },
    }),
  );
}

export function ApiCheckOutDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Tạo đơn hàng và thanh toán (Checkout)' }),
    ApiAuthFailures(),
    ApiBody({
      description: 'Thông tin thanh toán',
      schema: {
        example: {
          paymentMethod: 'payos',
          addressId: '123e4567-e89b-12d3-a456-426614174000',
          note: 'Giao nhanh vào buổi sáng',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Tạo đơn hàng và khởi tạo thanh toán thành công',
      schema: {
        example: {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          orderCode: 123456,
          checkoutUrl: 'https://pay.payos.vn/web/abc123',
          qrCode: 'https://api.vietqr.io/image/...',
          amount: 2750000,
          status: 'PENDING',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Giỏ hàng trống hoặc dữ liệu không hợp lệ',
      schema: { example: { message: 'Cart is empty' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Địa chỉ giao hàng không tìm thấy',
      schema: { example: { message: 'Address not found' } },
    }),
  );
}

export function ApiCancelPaymentDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Hủy thanh toán theo mã đơn hàng' }),
    ApiAuthFailures(),
    ApiBody({
      description: 'Mã đơn hàng và lý do hủy',
      schema: {
        example: {
          orderCode: '123456',
          cancelReason: 'Khách hàng đổi ý',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Hủy thanh toán thành công',
      schema: { example: { success: true, message: 'Payment cancelled' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng',
      schema: { example: { message: 'Order not found' } },
    }),
  );
}

export function ApiGetPaymentInformationDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy thông tin thanh toán theo paymentLinkId' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy thông tin thanh toán thành công',
      schema: {
        example: {
          id: 'paylink-001',
          orderCode: 123456,
          amount: 2750000,
          amountPaid: 2750000,
          amountRemaining: 0,
          status: 'PAID',
          createdAt: '2024-01-01T00:00:00.000Z',
          transactions: [
            {
              reference: 'TXN_REF_001',
              amount: 2750000,
              accountNumber: '12345678',
              description: 'Thanh toan don hang',
              transactionDateTime: '2024-01-01T10:00:00.000Z',
              virtualAccountName: null,
              virtualAccountNumber: null,
              counterAccountBankId: null,
              counterAccountBankName: null,
              counterAccountName: null,
              counterAccountNumber: null,
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy thông tin thanh toán',
      schema: { example: { message: 'Payment link not found' } },
    }),
  );
}
