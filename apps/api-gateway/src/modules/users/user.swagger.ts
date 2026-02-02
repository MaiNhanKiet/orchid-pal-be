import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetUsersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách người dùng với phân trang' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách người dùng thành công.',
      schema: {
        example: {
          data: [
            {
              id: 'uuid-1',
              email: 'user1@example.com',
              name: 'User One',
              role: { id: 1, name: 'Admin' },
              isBanned: false,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 'uuid-2',
              email: 'user2@example.com',
              name: 'User Two',
              role: { id: 2, name: 'User' },
              isBanned: false,
              createdAt: '2024-01-02T00:00:00.000Z',
            },
          ],
          meta: {
            total: 50,
            page: 1,
            limit: 10,
            totalPages: 5,
          },
        },
      },
    }),
  );
}

export function ApiBanUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Khóa (Ban) một người dùng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Khóa người dùng thành công.',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          isBanned: true,
          bannedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'UUID không hợp lệ.',
      schema: { example: { message: 'Invalid UUID format' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy người dùng.',
      schema: { example: { message: 'User not found' } },
    }),
  );
}

export function ApiAssignRoleDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Gán Role cho một người dùng' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 201,
      description: 'Gán Role cho người dùng thành công.',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          role: { id: 1, name: 'Admin', description: 'Quản trị viên' },
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ.',
      schema: {
        example: {
          message: 'Bad Request',
          errors: ['userId must be a UUID'],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy người dùng hoặc Role.',
      schema: { example: { message: 'User or Role not found' } },
    }),
  );
}
