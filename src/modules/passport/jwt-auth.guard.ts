import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth/auth.service';
import { UserDtoType } from '../users/dto/user.dto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const request = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (token) {
      const isTokenBlacklisted =
        await this.authService.isTokenBlacklisted(token);
      if (isTokenBlacklisted) {
        throw new UnauthorizedException('Token expired or invalid');
      }
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = UserDtoType>(err: any, user: TUser) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
