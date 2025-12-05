import Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';

import { ProductServiceService } from './product-service.service';
import { ProductServiceController } from './product-service.controller';
import { entities } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        PRODUCT_SERVICE_PORT: Joi.number().required(),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().default('postgres'),
        DB_NAME: Joi.string().default('product_db'),
      }),
    }),
    DatabaseModule.forRoot({
      entities,
    }),
  ],
  controllers: [ProductServiceController],
  providers: [ProductServiceService],
})
export class ProductServiceModule {}
