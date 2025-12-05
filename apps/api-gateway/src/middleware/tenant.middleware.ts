import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  INTERNAL_HEADERS,
  AuthenticatedUser,
  TenantContext,
} from '@app/common';

/**
 * Middleware que añade headers internos para la comunicación entre microservicios.
 * Se ejecuta DESPUÉS del ClerkAuthGuard, por lo que request.user y request.tenant
 * ya están disponibles.
 *
 * Este middleware prepara los headers que se enviarán a los microservicios internos:
 * - X-Tenant-ID: ID de la organización (tenant)
 * - X-User-ID: ID del usuario
 * - X-User-Role: Rol del usuario en la organización
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(
    req: Request & { user?: AuthenticatedUser; tenant?: TenantContext },
    res: Response,
    next: NextFunction,
  ) {
    // Si el usuario está autenticado, añadir headers internos
    if (req.user && req.tenant) {
      // Estos headers se usarán al hacer proxy a los microservicios
      req.headers[INTERNAL_HEADERS.TENANT_ID] = req.tenant.tenantId;
      req.headers[INTERNAL_HEADERS.USER_ID] = req.user.userId;

      if (req.user.role) {
        req.headers[INTERNAL_HEADERS.USER_ROLE] = req.user.role;
      }

      this.logger.debug(
        `Headers internos configurados - Tenant: ${req.tenant.tenantId}, User: ${req.user.userId}`,
      );
    }

    next();
  }
}
