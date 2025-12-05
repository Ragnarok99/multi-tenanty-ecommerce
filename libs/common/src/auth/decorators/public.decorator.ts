import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar un endpoint como público (sin autenticación requerida)
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
