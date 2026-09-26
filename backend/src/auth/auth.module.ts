import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

// Configure JWT authentication and export the strategy and guards for other modules
@Module({
  providers: [JwtStrategy, JwtAuthGuard, AdminGuard],
  exports: [JwtStrategy, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
