import { Injectable, BadRequestException, PipeTransform } from '@nestjs/common';
import { isValidObjectId, ObjectId } from 'mongoose';

@Injectable()
export class ObjectIdValidationPipe implements PipeTransform {
  transform(value: ObjectId) {
    if (!isValidObjectId(value)) {
      throw new BadRequestException('Invalid user id format');
    }
    return value;
  }
}
