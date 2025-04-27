import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ExtractJwt } from 'passport-jwt';
import { JwtPayloadCustom, RequestWithUser } from 'src/types';
import { RedisService } from '../redis/redis.service';
import { TransformUserDtoSchema } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import {
  ForgotPasswordType,
  RegisterDtoType,
  ResetPasswordType,
  VerifyForgotPasswordType,
  VerifyOTPType,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  // 👈 Recommended: 10-14
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plain, hash);
  }

  async blacklistToken(token: string, expiresInSeconds: number) {
    await this.redisService.set(`blacklist:${token}`, '1', expiresInSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redisService.get(`blacklist:${token}`);
    return result === '1';
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const isMatch = await this.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return TransformUserDtoSchema.parse(user);
  }

  generateAccessToken(user: JwtPayloadCustom) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload);
  }

  async login(user: JwtPayloadCustom) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    if (!user.isActive) {
      const otp = await this.usersService.generateOTP(user.email);
      this.mailService.sendOTP(user.email, otp);
      return {
        message:
          'Your account is not active. Please verify your account using the OTP sent to your email.',
        isActive: user.isActive,
      };
    }

    return {
      message: 'Login successful',
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDTO: RegisterDtoType) {
    const user = await this.usersService.create(registerDTO);
    const otp = await this.usersService.generateOTP(user.email);
    this.mailService.sendOTP(user.email, otp);
    return {
      message:
        'User created successfully. Please verify your account using the OTP sent to your email.',
      isActive: user.isActive,
    };
  }

  async getProfile(req: RequestWithUser) {
    return await this.usersService.getUserById(req.user.id.toString());
  }

  async verifyOTP(data: VerifyOTPType) {
    if (!data.otp || !data.email) {
      throw new BadRequestException('OTP is required');
    }
    const savedOtp = await this.redisService.get(`otp:${data.email}`);
    if (savedOtp !== data.otp) {
      throw new BadRequestException('OTP expired or incorrect');
    }
    await this.redisService.delete(`otp:${data.email}`);
    const user = await this.usersService.activateUser(data.email);
    const accessToken = this.generateAccessToken(user as JwtPayloadCustom);
    return {
      message: 'Verified successful',
      accessToken,
      user: TransformUserDtoSchema.parse(user),
    };
  }

  async logout(req: RequestWithUser) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException();
    if (token) {
      const decoded: JwtPayloadCustom = this.jwtService.decode(token);
      // return decoded;
      const expiresIn = decoded.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : 0;
      await this.blacklistToken(token, expiresIn);
    }

    return {
      message: 'Logout successful',
    };
  }

  async forgotPassword(data: ForgotPasswordType) {
    const { email } = data;
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new BadRequestException('User not active');
    }
    const temporaryToken = this.jwtService.sign(
      {
        email: user.email,
        id: user._id,
      },
      {
        secret: this.configService.get('RESET_PASSWORD_TOKEN_SECRET'),
        expiresIn: '10m',
      },
    );
    await this.redisService.set(
      `resetPassword:${temporaryToken}`,
      '1',
      10 * 60,
    );
    this.mailService.sendPasswordResetLink(user.email, temporaryToken);
    return {
      message: 'Please check your email',
    };
  }
  async verifyForgotPassword(data: VerifyForgotPasswordType) {
    const { key } = data;
    const savedToken = await this.redisService.get(`resetPassword:${key}`);
    if (savedToken !== '1') {
      throw new BadRequestException('Token expired or incorrect');
    }

    const decoded: JwtPayloadCustom = await this.jwtService.verifyAsync(key, {
      secret: this.configService.get('RESET_PASSWORD_TOKEN_SECRET'),
    });

    await this.usersService.findById(decoded.id);

    return {
      message: 'Success',
    };
  }

  async resetPassword(data: ResetPasswordType) {
    const { password, key } = data;
    const savedToken = await this.redisService.get(`resetPassword:${key}`);
    if (savedToken !== '1') {
      throw new BadRequestException('Key expired or incorrect');
    }

    await this.redisService.delete(`resetPassword:${key}`);

    const decoded: JwtPayloadCustom = await this.jwtService.verifyAsync(key, {
      secret: this.configService.get('RESET_PASSWORD_TOKEN_SECRET'),
    });
    const user = await this.usersService.findById(decoded.id);

    return await this.usersService.updatePassword(
      user._id.toString(),
      password,
    );
  }
}
