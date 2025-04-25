import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UserDtoType } from '../users/dto/user.dto';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { email, password } = request.body;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = UserDtoType>(err: any, user: TUser): TUser {
    if (err || !user) {
      throw err || new BadRequestException('Email and password are required');
    }

    return user;
  }
}
