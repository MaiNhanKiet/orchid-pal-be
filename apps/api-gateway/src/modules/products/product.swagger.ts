import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiGetAllProductsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách sản phẩm với phân trang' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách sản phẩm thành công',
      schema: {
        example: {
          products: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              sku: 'LAN-CTRL-001',
              name: 'Bộ điều khiển tưới tự động cho lan',
              description: 'Bộ điều khiển IoT chuyên dụng...',
              price: 1250000,
              stock_quantity: 50,
              image_url: 'https://cdn.example.com/images/lan-controller.jpg',
              is_published: true,
              created_at: '2024-01-01T00:00:00.000Z',
            },
          ],
          page: 1,
          limit: 10,
          total: 20,
          totalPages: 2,
        },
      },
    }),
  );
}

export function ApiGetProductByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết sản phẩm' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của sản phẩm',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết sản phẩm thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sku: 'LAN-CTRL-001',
          name: 'Bộ điều khiển tưới tự động cho lan',
          description: 'Bộ điều khiển IoT chuyên dụng...',
          price: 1250000,
          stock_quantity: 50,
          specs_config: {
            dimensions: { length: 15, width: 10, height: 5 },
            weight: 0.8,
            sensors: ['temperature', 'humidity', 'light'],
          },
          image_url: 'https://cdn.example.com/images/lan-controller.jpg',
          is_published: true,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ',
      schema: { example: { message: 'Invalid UUID format' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy sản phẩm',
      schema: { example: { message: 'Product not found' } },
    }),
  );
}

export function ApiCreateProductDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Tạo sản phẩm mới (Admin only)' }),
    ApiAuthFailures(),
    ApiBody({
      description: 'Thông tin sản phẩm mới',
      schema: {
        example: {
          sku: 'LAN-CTRL-002',
          name: 'Bộ điều khiển tưới tự động cho lan - v2',
          description: 'Phiên bản nâng cấp của bộ điều khiển IoT...',
          price: 1500000,
          stock_quantity: 50,
          image_url: 'https://cdn.example.com/images/lan-controller-v2.jpg',
          is_published: true,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Tạo sản phẩm thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sku: 'LAN-CTRL-001',
          name: 'Bộ điều khiển tưới tự động cho lan',
          price: 1250000,
          stock_quantity: 50,
          is_published: true,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ',
      schema: {
        example: {
          message: 'Bad Request',
          errors: ['sku must be a string', 'price must be positive'],
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'SKU đã tồn tại',
      schema: { example: { message: 'SKU already exists' } },
    }),
  );
}

export function ApiUpdateProductDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật sản phẩm (Admin only)' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của sản phẩm',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      description: 'Thông tin sản phẩm cần cập nhật (các trường đều optional)',
      schema: {
        example: {
          name: 'Bộ điều khiển tưới tự động cho lan - v2',
          price: 1500000,
          stock_quantity: 75,
          is_published: true,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật sản phẩm thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sku: 'LAN-CTRL-001-UPDATED',
          name: 'Bộ điều khiển tưới tự động cho lan - v2',
          price: 1500000,
          stock_quantity: 75,
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ hoặc dữ liệu không hợp lệ',
      schema: { example: { message: 'Invalid input data' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy sản phẩm',
      schema: { example: { message: 'Product not found' } },
    }),
  );
}

export function ApiDeleteProductDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa sản phẩm (Admin only)' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của sản phẩm',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Xóa sản phẩm thành công',
      schema: { example: { message: 'Product deleted successfully' } },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ',
      schema: { example: { message: 'Invalid UUID format' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy sản phẩm',
      schema: { example: { message: 'Product not found' } },
    }),
  );
}

export function ApiAddDevicesToProductDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Thêm thiết bị vào sản phẩm' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của sản phẩm',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      description: 'Cung cấp secretKey dùng chung và số lượng thiết bị cần tạo',
      schema: {
        example: {
          secretKey: 'shared-secret-key-123',
          quantity: 2,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Thêm thiết bị vào sản phẩm thành công',
      schema: {
        example: {
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          created: 2,
          stock_quantity: 52,
          devices: [
            {
              id: '6f2132a7-8f5f-46da-8ed6-89af8ef4da01',
              serial_number: 'LAN-CTRL-001-001',
              secret_key: 'shared-secret-key-123',
              product_id: '123e4567-e89b-12d3-a456-426614174000',
              status: 'INACTIVE',
            },
            {
              id: '4cb6c91f-cc1d-4cb6-9f1b-6f4f6bfe8d8a',
              serial_number: 'LAN-CTRL-001-002',
              secret_key: 'shared-secret-key-123',
              product_id: '123e4567-e89b-12d3-a456-426614174000',
              status: 'INACTIVE',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ hoặc dữ liệu đầu vào không hợp lệ',
      schema: { example: { message: 'Invalid input data' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy sản phẩm',
      schema: { example: { message: 'Product not found' } },
    }),
  );
}
