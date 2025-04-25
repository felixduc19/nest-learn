import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  PaginationDtoSchema,
  PaginationDtoType,
} from 'src/shared/dto/pagination.dto';
import { ObjectIdValidationPipe } from 'src/utils/pipes/objectIdValidationPipe';
import { ZodValidationPipe } from 'src/utils/pipes/zodValidationPipe';
import { UpdateUserDtoSchema, UpdateUserDtoType } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(PaginationDtoSchema))
    query: PaginationDtoType,
  ) {
    return await this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body(new ZodValidationPipe(UpdateUserDtoSchema))
    updateUserDto: UpdateUserDtoType,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.usersService.remove(id);
  }
}
