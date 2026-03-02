import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiGetAllCartItemsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy tất cả cart items' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy tất cả cart items thành công',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '223e4567-e89b-12d3-a456-426614174001',
            productId: '323e4567-e89b-12d3-a456-426614174002',
            quantity: 2,
            isSelected: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
  );
}

export function ApiGetCartItemsByUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy cart items của user với phân trang (Admin)' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của user',
      type: 'string',
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy cart items theo user thành công',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              userId: '223e4567-e89b-12d3-a456-426614174001',
              productId: '323e4567-e89b-12d3-a456-426614174002',
              quantity: 2,
              isSelected: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          meta: { total: 5, page: 1, limit: 10, totalPages: 1 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ',
      schema: { example: { message: 'Invalid UUID format' } },
    }),
  );
}

export function ApiGetCartItemsOfUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy cart items của user với phân trang' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lấy cart items theo user thành công',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              userId: '223e4567-e89b-12d3-a456-426614174001',
              productId: '323e4567-e89b-12d3-a456-426614174002',
              quantity: 2,
              isSelected: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          meta: { total: 5, page: 1, limit: 10, totalPages: 1 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ',
      schema: { example: { message: 'Invalid UUID format' } },
    }),
  );
}

export function ApiAddItemToCartDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Thêm item vào giỏ hàng' }),
    ApiAuthFailures(),
    ApiBody({
      description: 'Thông tin item cần thêm vào giỏ',
      schema: {
        example: {
          product_id: '323e4567-e89b-12d3-a456-426614174002',
          quantity: 2,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Thêm item vào giỏ hàng thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '223e4567-e89b-12d3-a456-426614174001',
          productId: '323e4567-e89b-12d3-a456-426614174002',
          quantity: 2,
          isSelected: true,
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
          errors: ['quantity must be positive', 'productId must be a UUID'],
        },
      },
    }),
  );
}

export function ApiRemoveItemFromCartDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa item khỏi giỏ hàng' }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của cart item',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Xóa item khỏi giỏ hàng thành công',
      schema: { example: { message: 'Item removed from cart' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy cart item',
      schema: { example: { message: 'Cart item not found' } },
    }),
  );
}

export function ApiUpdateCartItemDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cập nhật số lượng item và trạng thái chọn trong giỏ',
    }),
    ApiAuthFailures(),
    ApiParam({
      name: 'id',
      description: 'UUID của cart item',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      description: 'Thông tin cần cập nhật (quantity và/hoặc is_selected)',
      schema: {
        example: {
          quantity: 5,
          is_selected: true,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật số lượng và trạng thái chọn thành công',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '223e4567-e89b-12d3-a456-426614174001',
          productId: '323e4567-e89b-12d3-a456-426614174002',
          quantity: 5,
          isSelected: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Số lượng không hợp lệ',
      schema: { example: { message: 'Quantity must be positive' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy cart item',
      schema: { example: { message: 'Cart item not found' } },
    }),
  );
}
