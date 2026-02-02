import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllProductsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách sản phẩm với phân trang' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách sản phẩm thành công',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              sku: 'LAN-CTRL-001',
              name: 'Bộ điều khiển tưới tự động cho lan',
              description: 'Bộ điều khiển IoT chuyên dụng...',
              price: 1250000,
              stockQuantity: 50,
              imageUrl: 'https://cdn.example.com/images/lan-controller.jpg',
              isPublished: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          meta: {
            total: 20,
            page: 1,
            limit: 10,
            totalPages: 2,
          },
        },
      },
    }),
  );
}

export function ApiGetProductByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết sản phẩm' }),
    ApiAuthFailures(),
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
          stockQuantity: 50,
          specsConfig: {
            dimensions: { length: 15, width: 10, height: 5 },
            weight: 0.8,
            sensors: ['temperature', 'humidity', 'light'],
          },
          imageUrl: 'https://cdn.example.com/images/lan-controller.jpg',
          isPublished: true,
          createdAt: '2024-01-01T00:00:00.000Z',
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
    ApiResponse({
      status: 201,
      description: 'Tạo sản phẩm thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sku: 'LAN-CTRL-001',
          name: 'Bộ điều khiển tưới tự động cho lan',
          price: 1250000,
          stockQuantity: 50,
          isPublished: true,
          createdAt: '2024-01-01T00:00:00.000Z',
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
    ApiResponse({
      status: 200,
      description: 'Cập nhật sản phẩm thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sku: 'LAN-CTRL-001-UPDATED',
          name: 'Bộ điều khiển tưới tự động cho lan - v2',
          price: 1500000,
          stockQuantity: 75,
          updatedAt: '2024-01-02T00:00:00.000Z',
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
