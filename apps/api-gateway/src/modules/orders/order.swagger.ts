import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

const orderExample = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '456f7890-e89b-12d3-a456-426614174000',
  order_code: 'ORD20240101001',
  total_amount: '2750000.00',
  status: 'pending',
  shipping_info: {
    address: '123 Nguyen Hue, District 1, HCMC',
    phone: '0987654321',
    recipient_name: 'Nguyen Van A',
  },
  note: 'Giao nhanh vào buổi sáng',
  created_at: '2024-01-01T00:00:00.000Z',
};

export function ApiGetAllOrdersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả đơn hàng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách đơn hàng thành công',
      schema: { example: [orderExample] },
    }),
  );
}

export function ApiGetOrderByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của đơn hàng',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết đơn hàng thành công',
      schema: { example: orderExample },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng',
      schema: { example: { message: 'Order not found' } },
    }),
  );
}

export function ApiGetOrdersByUserIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng (Admin)' }),
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
      description: 'Lấy danh sách đơn hàng của user thành công',
      schema: { example: [orderExample] },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy user hoặc user không có đơn hàng',
      schema: { example: { message: 'User not found' } },
    }),
  );
}

export function ApiGetOrdersOfUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách đơn hàng của user thành công',
      schema: { example: [orderExample] },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy user hoặc user không có đơn hàng',
      schema: { example: { message: 'User not found' } },
    }),
  );
}

export function ApiUpdateOrderDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật thông tin đơn hàng' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của đơn hàng',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      description: 'Thông tin đơn hàng cần cập nhật (các trường đều optional)',
      schema: {
        example: {
          status: 'completed',
          shipping_info: {
            address: '456 Tran Hung Dao, District 5, HCMC',
            phone: '0912345678',
            recipient_name: 'Nguyen Van B',
          },
          note: 'Đã giao hàng',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật đơn hàng thành công',
      schema: {
        example: { ...orderExample, status: 'completed', note: 'Đã giao hàng' },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng',
      schema: { example: { message: 'Order not found' } },
    }),
  );
}

export function ApiDeleteOrderDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa đơn hàng theo ID' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của đơn hàng',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Xóa đơn hàng thành công',
      schema: { example: { message: 'Order deleted successfully' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng',
      schema: { example: { message: 'Order not found' } },
    }),
  );
}
