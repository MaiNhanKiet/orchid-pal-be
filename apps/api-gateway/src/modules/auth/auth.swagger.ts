import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';

export function ApiGoogleAuthDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Đăng nhập bằng Google OAuth 2.0' }),
    ApiResponse({
      status: 302,
      description: 'Chuyển hướng đến trang xác thực Google.',
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
  );
}

export function ApiRefreshTokenDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Làm mới Access Token bằng Refresh Token',
      description:
        'Sử dụng Refresh Token trong cookie để tạo một cặp Access Token và Refresh Token mới.',
    }),
    ApiCookieAuth('refresh_token'),
    ApiResponse({
      status: 200,
      description: 'Làm mới token thành công.',
      schema: {
        example: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Refresh token không hợp lệ hoặc không tìm thấy.',
      schema: {
        example: {
          statusCode: 401,
          message: 'Refresh token not found in cookies',
          error: 'Unauthorized',
        },
      },
    }),
  );
}

export function ApiLogoutDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Đăng xuất',
      description:
        'Thu hồi Refresh Token và xóa cookie. Người dùng sẽ cần đăng nhập lại để tiếp tục sử dụng hệ thống.',
    }),
    ApiCookieAuth('refresh_token'),
    ApiResponse({
      status: 200,
      description: 'Đăng xuất thành công.',
      schema: {
        example: {
          message: 'Logged out successfully',
        },
      },
    }),
  );
}
