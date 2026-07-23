import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiStreamTelemetryDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Stream telemetry realtime theo serial number',
      description:
        'SSE stream trả về dữ liệu cảm biến theo thời gian thực.\n\n' +
        '- Chỉ trả về dữ liệu của thiết bị có `serialNumber` tương ứng.\n' +
        '- Mỗi event chứa trường `sensors` (temp, humid, soil, light).\n',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Stream telemetry realtime thành công.',
      schema: {
        example: {
          data: {
            temp: 26.5,
            humid: 70,
            soil: 45,
            light: 800,
          },
        },
      },
    }),
  );
}

export function ApiGetLatestTelemetryDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy telemetry mới nhất theo serial number',
      description:
        'Gọi đến telemetry-service để lấy bản ghi telemetry mới nhất của thiết bị.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy telemetry mới nhất thành công.',
      schema: {
        example: {
          serialNumber: 'SN-1234567890',
          timestamp: '2025-01-01T12:34:56.789Z',
          sensors: {
            temp: 26.5,
            humid: 70,
            soil: 45,
            light: 800,
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy telemetry mới nhất.',
      schema: {
        example: { message: 'Telemetry not found' },
      },
    }),
  );
}

export function ApiGetHistoryTelemetryDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy lịch sử telemetry theo serial number',
      description:
        'Lấy lịch sử telemetry theo số giờ (mặc định 24h).',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy lịch sử telemetry thành công.',
    }),
  );
}
