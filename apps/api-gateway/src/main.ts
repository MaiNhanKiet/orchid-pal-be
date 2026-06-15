import { API_GATEWAY_PORT, RmqService } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './api-gateway.module';
import {
  buildSwaggerDocument,
  SWAGGER_UI_OPTIONS,
} from './swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('API_GATEWAY', false));

  const document = SwaggerModule.createDocument(
    app,
    buildSwaggerDocument(),
  );

  SwaggerModule.setup('docs', app, document, SWAGGER_UI_OPTIONS);

  app.enableCors({
    origin: '*',
  });

  await app.startAllMicroservices();
  await app.listen(API_GATEWAY_PORT);

  console.log(
    `[API Gateway]: HTTP Server & Swagger running on port ${API_GATEWAY_PORT}`,
  );
  console.log(`[API Gateway]: Swagger UI → http://localhost:${API_GATEWAY_PORT}/docs`);
  console.log(`[API Gateway]: RabbitMQ listener on API_GATEWAY_QUEUE`);
  console.log(`[API Gateway]: gRPC clients → identity, ecommerce, balcony, iot-engine`);
}
bootstrap();
