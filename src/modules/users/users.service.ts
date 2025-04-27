import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { PaginationDtoType } from 'src/shared/dto/pagination.dto';
import { PasswordService } from 'src/shared/services/password.service';
import { CreateUserDtoType } from './dto/create-user.dto';
import { UpdateUserDtoType } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { TransformUserDtoSchema } from './dto/user.dto';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly redisService: RedisService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
  ) {}

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).lean();
    return !!user;
  }

  async paginateUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(),
    ]);

    return {
      data: users.map((user) => TransformUserDtoSchema.parse(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(createUserDto: CreateUserDtoType) {
    const isTaken = await this.isEmailTaken(createUserDto.email);
    if (isTaken) {
      throw new ConflictException('Email already taken');
    }
    const hashedPassword = await this.passwordService.hash(
      createUserDto.password,
    );
    const createdUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser;
  }

  async findAll(query: PaginationDtoType) {
    return await this.paginateUsers(Number(query.page), Number(query.limit));
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('+password').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserById(id: string) {
    const user = await this.findById(id);

    return TransformUserDtoSchema.parse(user);
  }

  async findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').lean();
  }

  async update(id: string, updateUserDto: UpdateUserDtoType) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .lean();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async remove(id: string) {
    const removingUser = await this.userModel.findByIdAndDelete(id).lean();
    if (!removingUser) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
    };
  }

  async activateUser(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    await user.save();
    return user;
  }

  async generateOTP(email: string) {
    const existedOTP = await this.redisService.get(`otp:${email}`);
    if (existedOTP) {
      await this.redisService.delete(`otp:${email}`);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`otp:${email}`, otp);
    return otp;
  }

  async updatePassword(id: string, newPassword: string) {
    // const user = await this.findById(id);

    // console.log('user', user);

    // const isMatch = await this.passwordService.compare(
    //   oldPassword,
    //   user.password,
    // );
    // if (!isMatch) {
    //   throw new ConflictException('Old password is incorrect');
    // }
    // if (oldPassword === newPassword) {
    //   throw new ConflictException('New password must be different');
    // }

    const hashedPassword = await this.passwordService.hash(newPassword);
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { password: hashedPassword } },
        { new: true },
      )
      .lean();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    this.mailService.sendConfirmPasswordUpdated(
      updatedUser.name,
      updatedUser.email,
    );

    return {
      message: 'Password updated successfully',
    };
  }
}
