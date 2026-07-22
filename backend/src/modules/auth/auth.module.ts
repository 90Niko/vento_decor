import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreatorAuthGuard } from './creator-auth.guard';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, CreatorAuthGuard, AdminAuthGuard],
  exports: [AuthService, CreatorAuthGuard, AdminAuthGuard],
})
export class AuthModule {}
