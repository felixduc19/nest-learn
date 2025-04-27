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
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';
import { RequestWithUser } from 'src/types';
import { ZodValidationPipe } from 'src/utils/pipes/zodValidationPipe';
import { JwtAuthGuard } from '../passport/jwt-auth.guard';
import { LocalAuthGuard } from '../passport/local-auth.guard';
import { AuthService } from './auth.service';
import {
  ForgotPasswordSchema,
  ForgotPasswordType,
  RegisterDtoSchema,
  RegisterDtoType,
  ResetPasswordSchema,
  ResetPasswordType,
  VerifyForgotPasswordSchema,
  VerifyForgotPasswordType,
  VerifyOTPSchema,
  VerifyOTPType,
} from './dto/auth.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60 * 1000,
    },
  })
  login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 60 * 1000,
    },
  })
  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterDtoSchema))
  register(@Body() registerDto: RegisterDtoType) {
    return this.authService.register(registerDto);
  }

  // @Throttle()
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

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  @UsePipes(new ZodValidationPipe(VerifyOTPSchema))
  verifyOTP(@Body() data: VerifyOTPType) {
    return this.authService.verifyOTP(data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  forgotPassword(@Body() data: ForgotPasswordType) {
    return this.authService.forgotPassword(data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-forgot-password')
  @UsePipes(new ZodValidationPipe(VerifyForgotPasswordSchema))
  verifyForgotPassword(@Body() data: VerifyForgotPasswordType) {
    return this.authService.verifyForgotPassword(data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  resetPassword(@Body() data: ResetPasswordType) {
    return this.authService.resetPassword(data);
  }
}
