import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const SWAGGER_API_TAGS = [
  { name: '01 - Auth', description: 'Đăng nhập, đăng xuất, OAuth Google, refresh token' },
  { name: '02 - Users', description: 'Quản lý người dùng (admin)' },
  { name: '03 - RBAC', description: 'Vai trò và quyền hạn' },
  { name: '04 - Products', description: 'Catalog sản phẩm — hiển thị web, mua qua Messenger/Zalo' },
  { name: '05 - Plants', description: 'Cây của người dùng (1 Kit = 1 cây) + AI Vision phân tích góc đặt' },
  { name: '06 - Devices', description: 'Kit IoT — kích hoạt, gắn cây, điều khiển relay' },
  { name: '07 - Telemetry', description: 'Dữ liệu cảm biến realtime (SSE) và lịch sử' },
  { name: '08 - Automation', description: 'Luật tự động hóa theo thiết bị/relay' },
  { name: '09 - Expert Care', description: 'Chat 1-1 với chuyên gia + blog kiến thức' },
] as const;

export function buildSwaggerDocument() {
  const builder = new DocumentBuilder()
    .setTitle('GrowPal API')
    .setDescription(
      [
        'REST API Gateway cho **GrowPal** — nền tảng chăm cây thông minh.',
        '',
        '### Kiến trúc (3 services)',
        '| Service | Giao thức | Mô tả |',
        '|---------|-----------|-------|',
        '| **api-gateway** | HTTP REST | Entry point, Swagger, SSE |',
        '| **identity-service** | gRPC | Auth, Users, RBAC |',
        '| **plant-service** | gRPC + MQTT + RabbitMQ | Products, Plants, Devices, Telemetry, Vision, Expert |',
        '',
        '### Luồng dữ liệu cốt lõi',
        '`User` → `Plant` → `Device (Kit)` → `Automation Rules`',
        '',
        '### Bán hàng',
        'Không có giỏ hàng/thanh toán online. Sản phẩm hiển thị trên web, nút **Mua ngay** chuyển sang `buy_link` (Messenger/Zalo).',
        '',
        '### AI Vision',
        '`POST /plants/:id/analyze` — Gemini quét ảnh góc đặt cây, trả về `ai_space_analysis` và ngưỡng tưới tối ưu.',
        '',
        '### Realtime',
        '- SSE `GET /telemetry/stream/:serialNumber` — dữ liệu cảm biến (RabbitMQ → Gateway)',
        '',
        '### Xác thực',
        'Dùng Bearer JWT. Nhấn **Authorize** và dán access token.',
      ].join('\n'),
    )
    .setVersion('3.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Access token từ /auth',
        in: 'header',
      },
      'access-token',
    );

  for (const tag of SWAGGER_API_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}

export const SWAGGER_UI_OPTIONS: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    tagsSorter: (a: string, b: string) => a.localeCompare(b),
    operationsSorter: 'alpha',
    filter: true,
    displayRequestDuration: true,
  },
  customSiteTitle: 'GrowPal API Docs',
};
