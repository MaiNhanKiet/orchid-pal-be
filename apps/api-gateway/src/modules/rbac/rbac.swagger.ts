import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateRoleDto, UpdateRoleDto } from '@app/common';

export function ApiGetRolesDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả các Role' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách Role thành công.',
      schema: {
        example: [
          {
            id: 1,
            name: 'Admin',
            description: 'Quản trị viên hệ thống',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 2,
            name: 'User',
            description: 'Người dùng thông thường',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
  );
}

export function ApiCreateRoleDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Tạo mới một Role' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 201,
      description: 'Tạo Role thành công.',
      schema: {
        example: {
          id: 3,
          name: 'Manager',
          description: 'Quản lý cửa hàng',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ.',
      schema: {
        example: {
          message: 'Bad Request',
          errors: ['name should not be empty'],
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Role đã tồn tại.',
      schema: { example: { message: 'Role already exists' } },
    }),
  );
}

export function ApiUpdateRoleDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật thông tin một Role' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cập nhật Role thành công.',
      schema: {
        example: {
          id: 1,
          name: 'Super Admin',
          description: 'Quản trị viên cấp cao',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ.',
      schema: { example: { message: 'Bad Request' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy Role.',
      schema: { example: { message: 'Role not found' } },
    }),
  );
}

export function ApiDeleteRoleDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa một Role' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Xóa Role thành công.',
      schema: { example: { message: 'Role deleted successfully' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy Role.',
      schema: { example: { message: 'Role not found' } },
    }),
    ApiResponse({
      status: 409,
      description: 'Không thể xóa Role đang được sử dụng.',
      schema: { example: { message: 'Cannot delete role in use' } },
    }),
  );
}

export function ApiGetPermissionsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả các Permission (Quyền)' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách Permission thành công.',
      schema: {
        example: [
          {
            id: 1,
            name: 'USER_VIEW',
            description: 'Xem danh sách người dùng',
          },
          { id: 2, name: 'USER_CREATE', description: 'Tạo người dùng mới' },
          {
            id: 3,
            name: 'USER_UPDATE',
            description: 'Cập nhật thông tin người dùng',
          },
          { id: 4, name: 'USER_DELETE', description: 'Xóa người dùng' },
        ],
      },
    }),
  );
}

export function ApiAssignPermissionsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Gán danh sách quyền (Permissions) cho một Role' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 201,
      description: 'Gán quyền thành công.',
      schema: { example: { message: 'Permissions updated successfully' } },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ.',
      schema: {
        example: {
          message: 'Bad Request',
          errors: ['permissionIds must be an array'],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy Role hoặc Permission.',
      schema: { example: { message: 'Role or Permission not found' } },
    }),
  );
}
