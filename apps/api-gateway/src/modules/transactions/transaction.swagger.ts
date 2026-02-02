import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllTransactionsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách giao dịch thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            order_id: 'order-001',
            user_id: 'user-001',
            amount: '2750000.00',
            method: 'payos',
            status: 'completed',
            gateway_trans_id: 'payos-txn-001',
            gateway_log: {
              code: '00',
              desc: 'Chứng thực thành công',
              data: {
                checkoutUrl: 'https://payos.example.com/checkout/...',
              },
            },
            paid_at: '2024-01-01T01:00:00.000Z',
          },
        ],
      },
    }),
  );
}

export function ApiGetTransactionByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết giao dịch theo ID' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết giao dịch thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          order_id: 'order-001',
          user_id: 'user-001',
          amount: '2750000.00',
          method: 'payos',
          status: 'completed',
          gateway_trans_id: 'payos-txn-001',
          gateway_log: {
            code: '00',
            desc: 'Chứng thực thành công',
            data: {
              checkoutUrl: 'https://payos.example.com/checkout/...',
            },
          },
          paid_at: '2024-01-01T01:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy giao dịch',
      schema: { example: { message: 'Transaction not found' } },
    }),
  );
}

export function ApiGetTransactionsByUserIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách giao dịch của người dùng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách giao dịch của user thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            order_id: 'order-001',
            user_id: 'user-001',
            amount: '2750000.00',
            method: 'payos',
            status: 'completed',
            gateway_trans_id: 'payos-txn-001',
            gateway_log: null,
            paid_at: '2024-01-01T01:00:00.000Z',
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            order_id: 'order-002',
            user_id: 'user-001',
            amount: '5500000.00',
            method: 'cod',
            status: 'completed',
            gateway_trans_id: null,
            gateway_log: null,
            paid_at: null,
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy user hoặc user không có giao dịch',
      schema: { example: { message: 'User not found' } },
    }),
  );
}

export function ApiGetTransactionsByOrderIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy giao dịch của đơn hàng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy giao dịch của order thành công (trả về 1 giao dịch)',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          order_id: 'order-001',
          user_id: 'user-001',
          amount: '2750000.00',
          method: 'payos',
          status: 'completed',
          gateway_trans_id: 'payos-txn-001',
          gateway_log: {
            code: '00',
            desc: 'Chứng thực thành công',
          },
          paid_at: '2024-01-01T01:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng hoặc không có giao dịch',
      schema: { example: { message: 'Transaction not found' } },
    }),
  );
}
