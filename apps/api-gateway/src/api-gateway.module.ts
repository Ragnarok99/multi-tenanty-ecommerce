import Joi from 'joi';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClerkAuthGuard } from './guards';
import { TenantMiddleware } from './middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        // Server
        API_GATEWAY_PORT: Joi.number().default(3000),

        // Clerk (solo secret key, publishable es para frontend)
        CLERK_SECRET_KEY: Joi.string().required(),

        // Microservices URLs (para proxy)
        TENANT_SERVICE_URL: Joi.string().default('http://localhost:3001'),
        PRODUCT_SERVICE_URL: Joi.string().default('http://localhost:3002'),
      }),
    }),
  ],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    // Registrar ClerkAuthGuard como guard global
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar TenantMiddleware a todas las rutas
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
