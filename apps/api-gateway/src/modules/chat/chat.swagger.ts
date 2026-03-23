import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiOrchidChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Chat với OrchidPal AI (hỗ trợ text + ảnh)',
      description:
        'Nhận text và ảnh (multipart/form-data), sau đó chuyển sang telemetry-service để upload Cloudinary, gọi Gemini và lưu lịch sử chat.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'sessionId',
      required: true,
      description: 'ID phiên chat',
      example: 'session-abc-123',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['content'],
        properties: {
          content: {
            type: 'string',
            example: 'Lá lan của mình bị đốm nâu, giúp mình với.',
          },
          image: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Chat thành công.',
      schema: {
        example: {
          sessionId: 'session-abc-123',
          reply: 'Mình đã phân tích ảnh lá lan và nhận thấy...',
          userMessageId: '67db0d3c0f12f4b9aef8f111',
          modelMessageId: '67db0d3c0f12f4b9aef8f112',
        },
      },
    }),
  );
}
