import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const addressExample = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '456f7890-e89b-12d3-a456-426614174001',
  recipient_name: 'Nguyen Van A',
  phone: '0987654321',
  street: '123 Nguyen Hue',
  ward: 'Ben Nghe',
  district: 'District 1',
  city: 'Ho Chi Minh City',
  is_default: true,
  type: 'HOME',
  created_at: '2024-01-01T00:00:00.000Z',
};

const addressBodySchema = {
  properties: {
    recipient_name: { type: 'string', example: 'Nguyen Van A' },
    phone: { type: 'string', example: '0987654321' },
    street: { type: 'string', example: '123 Nguyen Hue' },
    ward: { type: 'string', example: 'Ben Nghe' },
    district: { type: 'string', example: 'District 1' },
    city: { type: 'string', example: 'Ho Chi Minh City' },
    is_default: { type: 'boolean', example: false },
    type: { type: 'string', enum: ['HOME', 'OFFICE'], example: 'HOME' },
  },
  required: ['recipient_name', 'phone', 'street', 'city'],
};

export function ApiCreateAddressDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Tạo địa chỉ mới cho user hiện tại' }),
    ApiAuthFailures(),
    ApiBody({
      description: 'Thông tin địa chỉ mới',
      schema: addressBodySchema,
    }),
    ApiResponse({
      status: 201,
      description: 'Tạo địa chỉ thành công',
      schema: { example: addressExample },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ',
      schema: {
        example: {
          message: 'Bad Request',
          errors: [
            'recipient_name should not be empty',
            'phone must be a string',
          ],
        },
      },
    }),
  );
}

export function ApiGetAllAddressesDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy tất cả địa chỉ của user hiện tại' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách địa chỉ thành công',
      schema: {
        example: [addressExample],
      },
    }),
  );
}

export function ApiGetAddressByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy chi tiết địa chỉ theo ID' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'UUID của địa chỉ', type: 'string' }),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết địa chỉ thành công',
      schema: { example: addressExample },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy địa chỉ',
      schema: { example: { message: 'Address not found' } },
    }),
  );
}

export function ApiUpdateAddressDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật thông tin địa chỉ' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'UUID của địa chỉ', type: 'string' }),
    ApiBody({
      description: 'Thông tin địa chỉ cần cập nhật (các trường đều optional)',
      schema: {
        example: {
          recipient_name: 'Nguyen Van B',
          phone: '0912345678',
          street: '456 Tran Hung Dao',
          district: 'District 5',
          city: 'Ho Chi Minh City',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật địa chỉ thành công',
      schema: {
        example: {
          ...addressExample,
          recipient_name: 'Nguyen Van B',
          phone: '0912345678',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy địa chỉ',
      schema: { example: { message: 'Address not found' } },
    }),
  );
}

export function ApiDeleteAddressDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa địa chỉ theo ID' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'UUID của địa chỉ', type: 'string' }),
    ApiResponse({
      status: 200,
      description: 'Xóa địa chỉ thành công',
      schema: { example: { message: 'Address deleted successfully' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy địa chỉ',
      schema: { example: { message: 'Address not found' } },
    }),
  );
}

export function ApiSetDefaultAddressDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Đặt địa chỉ làm địa chỉ mặc định' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'UUID của địa chỉ', type: 'string' }),
    ApiResponse({
      status: 200,
      description: 'Đặt địa chỉ mặc định thành công',
      schema: {
        example: { ...addressExample, is_default: true },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy địa chỉ',
      schema: { example: { message: 'Address not found' } },
    }),
  );
}
