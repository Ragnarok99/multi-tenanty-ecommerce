import Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';

import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';
import { entities } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        TENANT_SERVICE_PORT: Joi.number().required(),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().default('postgres'),
        DB_NAME: Joi.string().default('tenant_db'),
      }),
    }),
    DatabaseModule.forRoot({
      entities,
    }),
  ],
  controllers: [TenantServiceController],
  providers: [TenantServiceService],
})
export class TenantServiceModule {}
