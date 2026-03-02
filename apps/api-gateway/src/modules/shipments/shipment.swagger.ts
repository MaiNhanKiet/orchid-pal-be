import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

const shipmentExample = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  order_id: 'aabbccdd-e89b-12d3-a456-426614174001',
  carrier_name: 'GHN',
  tracking_code: 'GHN123456789',
  shipping_fee: '50000.00',
  status: 'in_transit',
  estimated_delivery_at: '2024-01-05T00:00:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
};

export function ApiGetAllShipmentsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả lô hàng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách lô hàng thành công',
      schema: { example: [shipmentExample] },
    }),
  );
}

export function ApiGetShipmentByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết lô hàng theo ID' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của lô hàng',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết lô hàng thành công',
      schema: { example: shipmentExample },
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
    ApiParam({
      name: 'id',
      description: 'UUID của đơn hàng',
      type: 'string',
      example: 'aabbccdd-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách lô hàng của order thành công',
      schema: { example: [shipmentExample] },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy đơn hàng hoặc không có lô hàng',
      schema: { example: { message: 'Order not found' } },
    }),
  );
}

export function ApiUpdateShipmentDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật thông tin lô hàng' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của lô hàng',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      description: 'Thông tin lô hàng cần cập nhật (các trường đều optional)',
      schema: {
        example: {
          carrier_name: 'GHTK',
          tracking_code: 'GHTK987654321',
          shipping_fee: 60000,
          status: 'delivered',
          estimated_delivery_at: '2024-01-06T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật lô hàng thành công',
      schema: {
        example: {
          ...shipmentExample,
          carrier_name: 'GHTK',
          status: 'delivered',
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

export function ApiDeleteShipmentDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa lô hàng theo ID' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của lô hàng',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Xóa lô hàng thành công',
      schema: { example: { message: 'Shipment deleted successfully' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy lô hàng',
      schema: { example: { message: 'Shipment not found' } },
    }),
  );
}
