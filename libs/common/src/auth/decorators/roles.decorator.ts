import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles disponibles en la organización de Clerk
 */
export type OrganizationRole = 'org:admin' | 'org:member';

/**
 * Decorador para requerir roles específicos
 *
 * @example
 * ```typescript
 * @Roles('org:admin')
 * @Get('admin/settings')
 * getAdminSettings() {
 *   return this.settingsService.getAll();
 * }
 *
 * // Múltiples roles (OR - cualquiera de los roles)
 * @Roles('org:admin', 'org:manager')
 * @Get('reports')
 * getReports() {
 *   return this.reportService.getAll();
 * }
 * ```
 */
export const Roles = (...roles: OrganizationRole[]) =>
  SetMetadata(ROLES_KEY, roles);
