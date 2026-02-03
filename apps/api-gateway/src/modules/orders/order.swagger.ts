import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllOrdersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả đơn hàng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách đơn hàng thành công',
      schema: {
        example: [
          {
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
          },
        ],
      },
    }),
  );
}

export function ApiGetOrderByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết đơn hàng thành công',
      schema: {
        example: {
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
        },
      },
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
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách đơn hàng của user thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '456f7890-e89b-12d3-a456-426614174000',
            order_code: 'ORD20240101001',
            total_amount: '2750000.00',
            status: 'completed',
            shipping_info: {
              address: '123 Nguyen Hue, District 1, HCMC',
              phone: '0987654321',
              recipient_name: 'Nguyen Van A',
            },
            note: null,
            created_at: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            user_id: '456f7890-e89b-12d3-a456-426614174000',
            order_code: 'ORD20240102002',
            total_amount: '5500000.00',
            status: 'pending',
            shipping_info: {
              address: '456 Tran Hung Dao, District 5, HCMC',
              phone: '0987654321',
              recipient_name: 'Nguyen Van A',
            },
            note: 'Giao vào thứ 6',
            created_at: '2024-01-02T00:00:00.000Z',
          },
        ],
      },
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
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách đơn hàng của user thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '456f7890-e89b-12d3-a456-426614174000',
            order_code: 'ORD20240101001',
            total_amount: '2750000.00',
            status: 'completed',
            shipping_info: {
              address: '123 Nguyen Hue, District 1, HCMC',
              phone: '0987654321',
              recipient_name: 'Nguyen Van A',
            },
            note: null,
            created_at: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            user_id: '456f7890-e89b-12d3-a456-426614174000',
            order_code: 'ORD20240102002',
            total_amount: '5500000.00',
            status: 'pending',
            shipping_info: {
              address: '456 Tran Hung Dao, District 5, HCMC',
              phone: '0987654321',
              recipient_name: 'Nguyen Van A',
            },
            note: 'Giao vào thứ 6',
            created_at: '2024-01-02T00:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy user hoặc user không có đơn hàng',
      schema: { example: { message: 'User not found' } },
    }),
  );
}
