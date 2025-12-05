import Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        TENANT_SERVICE_PORT: Joi.number().required(),
      }),
    }),
  ],
  controllers: [TenantServiceController],
  providers: [TenantServiceService],
})
export class TenantServiceModule {}
