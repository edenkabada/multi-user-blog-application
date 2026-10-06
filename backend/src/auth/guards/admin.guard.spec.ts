import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  const contextWithUser = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('allows the request through for an admin session (role and tokenType admin)', () => {
    const context = contextWithUser({
      userId: 1,
      username: 'alon',
      role: 'admin',
      tokenType: 'admin',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when the user is not an admin', () => {
    const context = contextWithUser({
      userId: 1,
      username: 'alon',
      role: 'user',
      tokenType: 'user',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for a normal-login token, even if it claims role admin', () => {
    const context = contextWithUser({
      userId: 1,
      username: 'alon',
      role: 'admin',
      tokenType: 'user',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for a legacy admin token without a tokenType', () => {
    const context = contextWithUser({
      userId: 1,
      username: 'alon',
      role: 'admin',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when tokenType is admin but role is not', () => {
    const context = contextWithUser({
      userId: 1,
      username: 'alon',
      role: 'user',
      tokenType: 'admin',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when there is no user on the request', () => {
    const context = contextWithUser(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
