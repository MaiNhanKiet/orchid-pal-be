import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetProfileDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy thông tin profile của user hiện tại' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy profile thành công.',
    }),
  );
}

export function ApiUpdateProfileDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật profile của user hiện tại' }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cập nhật profile thành công.',
    }),
  );
}
