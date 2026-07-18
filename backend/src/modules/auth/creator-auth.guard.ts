import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

export const CREATOR_COOKIE = 'vento_creator_session';

@Injectable()
export class CreatorAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { cookie?: string };
      creator?: unknown;
    }>();
    const cookies = Object.fromEntries(
      (request.headers.cookie ?? '').split(';').filter(Boolean).map((part) => {
        const [key, ...value] = part.trim().split('=');
        return [key, decodeURIComponent(value.join('='))];
      }),
    );
    const creator = this.authService.verifySession(cookies[CREATOR_COOKIE]);
    if (!creator) throw new UnauthorizedException('Необходимо е да влезете в профила си.');
    request.creator = creator;
    return true;
  }
}
