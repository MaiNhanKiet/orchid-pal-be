import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllShipmentsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả lô hàng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách lô hàng thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            order_id: 'order-001',
            carrier_name: 'GHN',
            tracking_code: 'GHN123456789',
            shipping_fee: '50000.00',
            status: 'in_transit',
            estimated_delivery_at: '2024-01-05T00:00:00.000Z',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
  );
}

export function ApiGetShipmentByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết lô hàng theo ID' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết lô hàng thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          order_id: 'order-001',
          carrier_name: 'GHN',
          tracking_code: 'GHN123456789',
          shipping_fee: '50000.00',
          status: 'in_transit',
          estimated_delivery_at: '2024-01-05T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy lô hàng',
      schema: { example: { message: 'Shipment not found' } },
    }),
  );
}

export function ApiGetShipmentsByOrderIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách lô hàng của đơn hàng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách lô hàng của order thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            order_id: 'order-001',
            carrier_name: 'GHN',
            tracking_code: 'GHN123456789',
            shipping_fee: '50000.00',
            status: 'in_transit',
            estimated_delivery_at: '2024-01-05T00:00:00.000Z',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng hoặc không có lô hàng',
      schema: { example: { message: 'Order not found' } },
    }),
  );
}
