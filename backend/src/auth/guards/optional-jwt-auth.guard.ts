import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Allows anonymous access while identifying users with a valid JWT
  handleRequest(err, user) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}