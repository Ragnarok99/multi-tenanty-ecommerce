import type { Request } from 'express';

/**
 * Representa el usuario autenticado extraído del JWT de Clerk
 */
export interface AuthenticatedUser {
  /** ID único del usuario en Clerk (sub claim) */
  userId: string;

  /** ID de la organización (tenant) - org_id claim */
  tenantId: string | null;

  /** Rol del usuario en la organización */
  role: string | null;

  /** Email del usuario (si está disponible) */
  email?: string;

  /** Nombre completo del usuario */
  fullName?: string;

  /** URL de la imagen del usuario */
  imageUrl?: string;

  /** Claims adicionales del JWT */
  sessionClaims?: Record<string, unknown>;
}

/**
 * Contexto del tenant para las peticiones
 */
export interface TenantContext {
  /** ID del tenant (organization ID de Clerk) */
  tenantId: string;

  /** Subdominio desde donde se hace la pedición */
  subdomain?: string;
}

/**
 * Request de Express extendido con información de autenticación
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tenant: TenantContext | null;
}

/**
 * Headers internos usados entre microservicios
 */
export const INTERNAL_HEADERS = {
  TENANT_ID: 'x-tenant-id',
  USER_ID: 'x-user-id',
  USER_ROLE: 'x-user-role',
} as const;
