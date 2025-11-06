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
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // Crear microservicio gRPC
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user_management',
      protoPath: join(__dirname, '../src/proto/user.proto'),
      url: process.env.GRPC_URL || '0.0.0.0:50051',
    },
  });

  // Iniciar ambos servicios
  await app.startAllMicroservices();
  await app.listen(3000);
  
  console.log('User Management HTTP API is listening on port 3000');
  console.log('User Management gRPC Microservice is listening on port 50051');
}
bootstrap();
