import { API_GATEWAY_PORT, RmqService } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // =========================================================
  // 1. CẤU HÌNH RABBITMQ
  // =========================================================
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('API_GATEWAY', false));

  // =========================================================
  // 2. CẤU HÌNH SWAGGER
  // =========================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Orchid Pal API Gateway')
    .setDescription('API Gateway documentation for Orchid Pal System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'APIs for Authentication')
    .addTag('Users', 'APIs for User Management')
    .addTag('RBAC', 'APIs for Role & Permission Management')
    .addTag('Species', 'APIs for Species Wiki (Từ điển loài Lan)')
    .addTag('Zones', 'APIs for Garden Zones (Vườn)')
    .addTag('Devices', 'APIs for Device Registry (Quản lý thiết bị)')
    .addTag('Telemetry', 'APIs for Sensor Data & Real-time')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Mở CORS
  app.enableCors({
    origin: '*',
  });

  // =========================================================
  // 3. KHỞI ĐỘNG HỆ THỐNG
  // =========================================================
  await app.startAllMicroservices();
  await app.listen(API_GATEWAY_PORT);

  console.log(
    `[API Gateway]: HTTP Server & Swagger running on port ${API_GATEWAY_PORT}`,
  );
  console.log(`[API Gateway]: running on RabbitMQ Queue`);
}
bootstrap();
