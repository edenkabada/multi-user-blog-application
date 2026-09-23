import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Configure JWT authentication using the Authorization header
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // Validate the JWT payload and return the authenticated user's information
  validate(payload: { sub: number; username: string }) {
    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}