import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, TenantContext } from '../interfaces';

/**
 * Decorador para extraer el contexto del tenant del request
 *
 * @example
 * ```typescript
 * @Get('products')
 * getProducts(@CurrentTenant() tenant: TenantContext) {
 *   return this.productService.findByTenant(tenant.tenantId);
 * }
 *
 * // También puedes extraer solo el tenantId
 * @Get('products')
 * getProducts(@CurrentTenant('tenantId') tenantId: string) {
 *   return this.productService.findByTenant(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenant = request.tenant as TenantContext;

    if (!tenant) {
      return null;
    }

    return data ? tenant[data] : tenant;
  },
);
