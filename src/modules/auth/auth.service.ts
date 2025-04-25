import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ExtractJwt } from 'passport-jwt';
import { JwtPayloadCustom, RequestWithUser } from 'src/types';
import { RedisService } from '../redis/redis.service';
import { TransformUserDtoSchema } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { RegisterDtoType } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  // 👈 Recommended: 10-14
  private readonly saltRounds = 12;

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
    console.log('result', result);
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
    console.log('user', user);
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    if (!user.isActive) {
      await this.usersService.generateOTP(user.email);
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

    return {
      message: 'User created successfully',
      user,
    };
  }

  async getProfile(req: RequestWithUser) {
    return await this.usersService.findById(req.user.id.toString());
  }

  async verifyOTP(data: { otp: string; email: string }) {
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
      user,
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
}
