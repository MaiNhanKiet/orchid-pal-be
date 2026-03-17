import { ApiAuthFailures } from '@app/common';
import { TransactionStatus } from '@app/common/enums';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

const transactionExample = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  order_id: 'aabbccdd-e89b-12d3-a456-426614174001',
  user_id: '456f7890-e89b-12d3-a456-426614174000',
  amount: '2750000.00',
  method: 'payos',
  status: TransactionStatus.SUCCESS,
  gateway_trans_id: 'payos-txn-001',
  gateway_log: {
    code: '00',
    desc: 'Chứng thực thành công',
    data: { checkoutUrl: 'https://payos.example.com/checkout/...' },
  },
  paid_at: '2024-01-01T01:00:00.000Z',
};

export function ApiGetAllTransactionsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách giao dịch thành công',
      schema: { example: [transactionExample] },
    }),
  );
}

export function ApiGetTransactionByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết giao dịch theo ID' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của giao dịch',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết giao dịch thành công',
      schema: { example: transactionExample },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy giao dịch',
      schema: { example: { message: 'Transaction not found' } },
    }),
  );
}

export function ApiGetTransactionsOfUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách giao dịch của người dùng' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách giao dịch của user thành công',
      schema: { example: [transactionExample] },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy user hoặc user không có giao dịch',
      schema: { example: { message: 'User not found' } },
    }),
  );
}

export function ApiGetTransactionsByUserIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách giao dịch của người dùng (Admin)' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của user',
      type: 'string',
      example: '456f7890-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách giao dịch của user thành công',
      schema: { example: [transactionExample] },
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
    ApiParam({
      name: 'id',
      description: 'UUID của đơn hàng',
      type: 'string',
      example: 'aabbccdd-e89b-12d3-a456-426614174001',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy giao dịch của order thành công (trả về 1 giao dịch)',
      schema: { example: transactionExample },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng hoặc không có giao dịch',
      schema: { example: { message: 'Transaction not found' } },
    }),
  );
}

export function ApiUpdateTransactionDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật thông tin giao dịch' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của giao dịch',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      description: 'Thông tin giao dịch cần cập nhật (các trường đều optional)',
      schema: {
        example: {
          status: TransactionStatus.SUCCESS,
          gateway_trans_id: 'payos-txn-updated',
          gateway_log: { code: '00', desc: 'Thanh toán thành công' },
          paid_at: '2024-01-01T02:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật giao dịch thành công',
      schema: {
        example: {
          ...transactionExample,
          gateway_trans_id: 'payos-txn-updated',
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

export function ApiDeleteTransactionDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa giao dịch theo ID' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của giao dịch',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Xóa giao dịch thành công',
      schema: { example: { message: 'Transaction deleted successfully' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy giao dịch',
      schema: { example: { message: 'Transaction not found' } },
    }),
  );
}
