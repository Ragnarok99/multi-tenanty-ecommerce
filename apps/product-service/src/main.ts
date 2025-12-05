import { NestFactory } from '@nestjs/core';
import { ProductServiceModule } from './product-service.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(ProductServiceModule);

  const configService = app.get(ConfigService);

  await app.listen(configService.get('PRODUCT_SERVICE_PORT') ?? 3002);
}
bootstrap();
