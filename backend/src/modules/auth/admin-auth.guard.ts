import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreatorAuthGuard } from './creator-auth.guard';
import { CreatorSession } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly creatorGuard: CreatorAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.creatorGuard.canActivate(context);
    const request = context
      .switchToHttp()
      .getRequest<{ creator: CreatorSession }>();
    if (request.creator.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Тази зона е достъпна само за администратора.',
      );
    }
    return true;
  }
}
