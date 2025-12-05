import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { IS_PUBLIC_KEY, ROLES_KEY } from '@app/common';
import type {
  AuthenticatedUser,
  TenantContext,
  OrganizationRole,
  AuthenticatedRequest,
} from '@app/common';

// Interfaz para los claims de organización en Clerk v2
interface ClerkOrgClaims {
  id: string; // Organization ID
  slg: string; // Slug
  rol: string; // Role sin prefijo "org:"
  per?: string; // Permissions
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly secretKey: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.getOrThrow<string>('CLERK_SECRET_KEY');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si el endpoint es público
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    try {
      // Verificar el JWT con Clerk (función standalone)
      const verifiedToken = await verifyToken(token, {
        secretKey: this.secretKey,
      });

      // Extraer claims de organización (Clerk v2 usa "o" para org claims)
      const orgClaims = verifiedToken.o as ClerkOrgClaims | undefined;

      // Construir el objeto de usuario autenticado
      const user: AuthenticatedUser = {
        userId: verifiedToken.sub,
        tenantId: orgClaims?.id || null,
        role: orgClaims?.rol ? `org:${orgClaims.rol}` : null, // Añadir prefijo org:
        sessionClaims: verifiedToken,
      };

      // Construir el contexto del tenant
      const tenant: TenantContext | null = user.tenantId
        ? {
            tenantId: user.tenantId,
            subdomain: this.extractSubdomain(request),
          }
        : null;

      // Verificar que el usuario pertenece a una organización (tenant)
      if (!user.tenantId) {
        this.logger.warn(
          `Usuario ${user.userId} intentó acceder sin organización`,
        );
        throw new UnauthorizedException(
          'Debes pertenecer a una organización para acceder',
        );
      }

      // Verificar roles si están definidos en el endpoint
      const requiredRoles = this.reflector.getAllAndOverride<
        OrganizationRole[]
      >(ROLES_KEY, [context.getHandler(), context.getClass()]);

      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.some((role) => user.role === role);
        if (!hasRole) {
          this.logger.warn(
            `Usuario ${user.userId} con rol ${user.role} intentó acceder a recurso que requiere: ${requiredRoles.join(', ')}`,
          );
          throw new UnauthorizedException('No tienes permisos suficientes');
        }
      }

      // Adjuntar usuario y tenant al request
      request.user = user;
      request.tenant = tenant;

      this.logger.debug(
        `Usuario ${user.userId} autenticado para tenant ${user.tenantId}`,
      );

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error verificando token: ${message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractTokenFromHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractSubdomain(request: AuthenticatedRequest): string | undefined {
    const host = request.headers.host || '';
    const parts = host.split('.');

    // Si hay más de 2 partes (subdomain.domain.tld), el primero es el subdomain
    if (parts.length > 2) {
      return parts[0];
    }

    return undefined;
  }
}
