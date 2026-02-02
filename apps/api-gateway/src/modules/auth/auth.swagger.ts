import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGoogleAuthDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Đăng nhập bằng Google OAuth 2.0' }),
    ApiResponse({
      status: 302,
      description: 'Chuyển hướng đến trang xác thực Google.',
    }),
    ApiResponse({
      status: 500,
      description: 'Lỗi server nội bộ.',
      schema: { example: { message: 'Internal server error' } },
    }),
  );
}

export function ApiGoogleAuthCallbackDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Xử lý callback sau khi xác thực Google thành công',
    }),
    ApiResponse({
      status: 302,
      description:
        'Chuyển hướng về Frontend với Access Token trong URL và Refresh Token trong cookie.',
      schema: {
        example: {
          redirect:
            'http://frontend-url?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          cookie: 'refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Xác thực thất bại.',
      schema: { example: { message: 'Unauthorized' } },
    }),
    ApiResponse({
      status: 500,
      description: 'Lỗi server nội bộ.',
      schema: { example: { message: 'Internal server error' } },
    }),
  );
}
