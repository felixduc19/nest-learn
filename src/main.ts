import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1', { exclude: [''] });
  const configService = app.get(ConfigService);
  app.use(helmet());
  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
