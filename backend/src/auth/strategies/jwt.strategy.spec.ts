import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from '../guards/admin.guard';

describe('JwtStrategy', () => {
  const secret = 'test-secret';
  const jwtService = new JwtService({ secret });
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      getOrThrow: () => secret,
    } as unknown as ConfigService;
    strategy = new JwtStrategy(configService);
  });

  // Sign a payload, verify it with the same secret, and run it through
  // validate() -- the same path a real request takes before AdminGuard.
  const userFromToken = (payload: Record<string, unknown>) =>
    strategy.validate(jwtService.verify(jwtService.sign(payload), { secret }));

  const contextWithUser = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('exposes userId, username, role, and tokenType on request.user', () => {
    expect(
      strategy.validate({
        sub: 1,
        username: 'alon',
        role: 'user',
        tokenType: 'user',
      }),
    ).toEqual({ userId: 1, username: 'alon', role: 'user', tokenType: 'user' });
  });

  it('leaves tokenType undefined for legacy tokens issued without it', () => {
    expect(
      strategy.validate({ sub: 1, username: 'alon', role: 'admin' }),
    ).toEqual({
      userId: 1,
      username: 'alon',
      role: 'admin',
      tokenType: undefined,
    });
  });

  describe('combined with AdminGuard', () => {
    const guard = new AdminGuard();

    it('lets an admin-login token through', () => {
      const user = userFromToken({
        sub: 7,
        username: 'admin',
        role: 'admin',
        tokenType: 'admin',
      });

      expect(guard.canActivate(contextWithUser(user))).toBe(true);
    });

    it('rejects a normal-login token issued to an admin account', () => {
      const user = userFromToken({
        sub: 7,
        username: 'admin',
        role: 'user',
        tokenType: 'user',
      });

      expect(() => guard.canActivate(contextWithUser(user))).toThrow(
        ForbiddenException,
      );
    });
  });
});
