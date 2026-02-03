import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

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
          meta: {
            total: 5,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
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
          meta: {
            total: 5,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
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

export function ApiUpdateCartItemQuantityDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật số lượng item trong giỏ' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cập nhật số lượng thành công',
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
