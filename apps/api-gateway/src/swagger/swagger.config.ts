import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const SWAGGER_API_TAGS = [
  { name: '01 - Auth', description: 'Đăng nhập, đăng xuất, OAuth Google, refresh token' },
  { name: '02 - Users', description: 'Quản lý người dùng (admin)' },
  { name: '03 - RBAC', description: 'Vai trò và quyền hạn' },
  { name: '04 - Products', description: 'Danh mục sản phẩm (Balcony Garden Kit)' },
  { name: '05 - Carts', description: 'Giỏ hàng' },
  { name: '06 - Orders', description: 'Đơn hàng' },
  { name: '07 - Payment', description: 'Thanh toán PayOS, webhook, SSE trạng thái' },
  { name: '08 - Transactions', description: 'Giao dịch thanh toán' },
  { name: '09 - Shipments', description: 'Vận chuyển và địa chỉ giao hàng' },
  { name: '10 - Dashboard', description: 'Thống kê doanh thu (admin)' },
  { name: '11 - Plant Wiki', description: 'Từ điển loài cây (plant_wiki)' },
  { name: '12 - Balcony Zones', description: 'Khu ban công (balcony_zones)' },
  { name: '13 - My Plants', description: 'Cây của người dùng' },
  { name: '14 - Devices', description: 'Thiết bị IoT — đăng ký, gán zone, điều khiển' },
  { name: '15 - Telemetry', description: 'Dữ liệu cảm biến, SSE realtime' },
  { name: '16 - Chat', description: 'AI tư vấn chăm cây (Gemini)' },
  { name: '17 - Automation', description: 'Luật tự động hóa ban công (IoT + AI)' },
] as const;

export function buildSwaggerDocument() {
  const builder = new DocumentBuilder()
    .setTitle('Balcony Garden Kit API')
    .setDescription(
      [
        'REST API Gateway cho hệ thống **Balcony Garden Kit MVP**.',
        '',
        '### Kiến trúc microservices',
        '| Service | Giao thức nội bộ | Mô tả |',
        '|---------|-----------------|-------|',
        '| identity-service | **gRPC** | Auth, Users, RBAC |',
        '| ecommerce-service | **gRPC** | Products, Carts, Orders, Payment |',
        '| balcony-service | **gRPC** | Balcony Zones, Plant Wiki, My Plants |',
        '| iot-engine-service | **gRPC** + MQTT + RabbitMQ | Devices, Telemetry, Automation |',
        '',
        '### Realtime',
        '- SSE `/telemetry/stream/:serialNumber` — dữ liệu cảm biến (RabbitMQ → Gateway)',
        '- SSE `/payment/sse/:orderCode` — trạng thái thanh toán (RabbitMQ → Gateway)',
        '',
        '### Xác thực',
        'Dùng Bearer JWT. Nhấn **Authorize** và dán access token.',
      ].join('\n'),
    )
    .setVersion('2.1.0')
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
  customSiteTitle: 'Balcony Garden Kit API Docs',
};
