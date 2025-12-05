import { NestFactory } from '@nestjs/core';
import { TenantServiceModule } from './tenant-service.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(TenantServiceModule);

  const configService = app.get(ConfigService);
  await app.listen(configService.get('TENANT_SERVICE_PORT') ?? 3003);
}
bootstrap();
