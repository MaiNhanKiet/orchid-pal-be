import { API_GATEWAY_PORT, RmqService } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './api-gateway.module';
import {
  buildSwaggerDocument,
  SWAGGER_UI_OPTIONS,
} from './swagger/swagger.config';

function logStartupEnv() {
  const required = [
    'API_GATEWAY_PORT',
    'JWT_ACCESS_TOKEN_SECRET',
    'JWT_REFRESH_TOKEN_SECRET',
    'REDIS_URL',
    'RABBITMQ_HOST',
    'RABBITMQ_USER',
    'RABBITMQ_PASS',
    'IDENTITY_SERVICE_HOST',
    'PLANT_SERVICE_HOST',
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    console.warn(`[API Gateway] Missing env: ${missing.join(', ')}`);
  }
  console.log(`[API Gateway] API_GATEWAY_PORT=${API_GATEWAY_PORT}`);
}

async function bootstrap() {
  logStartupEnv();

  const port = Number(API_GATEWAY_PORT);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid API_GATEWAY_PORT: "${API_GATEWAY_PORT}"`);
  }
  if (port === 3000) {
    console.warn(
      '[API Gateway] Port 3000 thường bị orchidpal-web chiếm — nên dùng 4000',
    );
  }

  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(cookieParser());

  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('API_GATEWAY', false));

  const document = SwaggerModule.createDocument(app, buildSwaggerDocument());

  SwaggerModule.setup('docs', app, document, SWAGGER_UI_OPTIONS);

  app.enableCors({
    origin: '*',
  });

  // Bind HTTP trước — tránh restart loop khi RabbitMQ chậm; port conflict log rõ hơn
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`[API Gateway]: HTTP Server & Swagger running on 0.0.0.0:${port}`);
    console.log(`[API Gateway]: Swagger UI → http://localhost:${port}/docs`);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'EADDRINUSE') {
      console.error(
        `[API Gateway] Port ${port} đã bị chiếm — đổi API_GATEWAY_PORT (vd. 4000)`,
      );
    }
    throw error;
  }

  try {
    await app.startAllMicroservices();
    console.log('[API Gateway]: RabbitMQ listener on API_GATEWAY_QUEUE');
  } catch (error) {
    console.error(
      '[API Gateway] RabbitMQ consumer failed — HTTP vẫn chạy, kiểm tra RABBITMQ_*:',
      error,
    );
  }

  console.log('[API Gateway]: gRPC clients → identity, plant-service');
}
bootstrap().catch((error) => {
  console.error('[API Gateway] Bootstrap failed:', error);
  process.exit(1);
});
