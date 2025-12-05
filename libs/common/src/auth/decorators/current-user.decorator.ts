import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthenticatedUser } from '../interfaces';

/**
 * Decorador para extraer el usuario autenticado del request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 *
 * // También puedes extraer una propiedad específica
 * @Get('my-id')
 * getMyId(@CurrentUser('userId') userId: string) {
 *   return userId;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
