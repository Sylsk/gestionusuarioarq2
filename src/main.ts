import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

// Cargar variables de entorno explícitamente
dotenv.config();

async function bootstrap() {
  // Crear aplicación HTTP
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5000', 'http://127.0.0.1:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // Crear microservicio gRPC
  const microserviceGrpc = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user_management',
      protoPath: join(__dirname, '../src/proto/user.proto'),
      url: process.env.GRPC_URL || '0.0.0.0:50051',
    },
  });

  // Crear microservicio RabbitMQ
  const microserviceRabbit = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@reservas_rabbitmq:5672'],
      queue: 'user_queue',
      queueOptions: {
        durable: false
      },
    },
  });

  // Iniciar ambos servicios
  await app.startAllMicroservices();
  await app.listen(3000);
  
  console.log('User Management HTTP API is listening on port 3000');
  console.log('User Management gRPC Microservice is listening on port 50051');
  console.log('User Management RabbitMQ Microservice is listening on queue user_queue');
}
bootstrap();
