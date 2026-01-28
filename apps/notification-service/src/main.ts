import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { RmqService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const rmqService = app.get<RmqService>(RmqService);

  app.connectMicroservice(rmqService.getOptions('NOTIFICATION_SERVICE'));

  await app.startAllMicroservices();
  console.log(`[ Notification Microservice]: running on RabbitMQ Queue`);
}
bootstrap();
