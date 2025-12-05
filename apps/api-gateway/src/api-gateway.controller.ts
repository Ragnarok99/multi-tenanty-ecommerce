import { Controller, Get } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { Public, CurrentUser, CurrentTenant } from '@app/common';
import type { AuthenticatedUser, TenantContext } from '@app/common';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  /**
   * Health check - público, sin autenticación
   */
  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Información del usuario autenticado - requiere autenticación
   */
  @Get('me')
  getMe(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return {
      user: {
        id: user.userId,
        role: user.role,
      },
      tenant: {
        id: tenant.tenantId,
        subdomain: tenant.subdomain,
      },
    };
  }

  @Public()
  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }
}
