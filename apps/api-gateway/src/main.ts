import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './api-gateway.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') ?? 3000;

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
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`[API Gateway]: running on http://localhost:${port}/docs`);
}
bootstrap();
