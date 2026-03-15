import { NestFactory } from '@nestjs/core';
import { RmqService } from '@app/common';
import { AutomationServiceModule } from './automation-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AutomationServiceModule);
  const rmqService = app.get<RmqService>(RmqService);

  app.connectMicroservice(rmqService.getOptions('AUTOMATION', false));

  await app.startAllMicroservices();
  console.log(`[Automation Microservice]: running on RabbitMQ Queue`);
}
bootstrap();
