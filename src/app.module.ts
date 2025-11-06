import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user.module';
import { User } from './entities/user.entity';
import { TestController } from './controllers/test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'user_management',
      entities: [User],
      synchronize: true, // Solo para desarrollo
      logging: true,
      extra: {
        connectionTimeoutMillis: 30000,
      },
    }),
    UserModule,
  ],
  controllers: [TestController],
})
export class AppModule {}
