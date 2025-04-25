import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { RequestWithUser } from 'src/types';
import { ZodValidationPipe } from 'src/utils/pipes/zodValidationPipe';
import { JwtAuthGuard } from '../passport/jwt-auth.guard';
import { LocalAuthGuard } from '../passport/local-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDtoSchema, RegisterDtoType } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterDtoSchema))
  register(@Body() registerDto: RegisterDtoType) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 2, ttl: 1 } })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return this.authService.getProfile(req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: RequestWithUser) {
    return this.authService.logout(req);
  }

  // @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  verifyOTP(@Body() data: { otp: string; email: string }) {
    return this.authService.verifyOTP(data);
  }

  // @Post()
  // forgotPassword(@Body() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }
  // @Post()
  // resetPassword(@Body() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }
}
