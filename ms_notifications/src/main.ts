import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar microservicio de RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/'],
      queue: 'notifications_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Iniciar ambos: RabbitMQ listener y el servidor HTTP
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log(`ms_notifications is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
