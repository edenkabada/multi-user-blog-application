import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface RequestWithUser {
  user?: { userId: number; username: string; role: string; tokenType?: string };
}

// Restricts a route to admin sessions: role 'admin' AND tokenType 'admin'.
// Only POST /users/admin-login issues such tokens, so an admin account that
// signed in through the normal /users/login flow is rejected here.
// Must run after JwtAuthGuard, which is what populates request.user.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (request.user?.role !== 'admin' || request.user?.tokenType !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
