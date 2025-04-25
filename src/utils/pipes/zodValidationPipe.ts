import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const parsedValue = this.schema.safeParse(value);
    if (parsedValue.success) {
      return parsedValue.data;
    }

    throw new BadRequestException(
      parsedValue.error.issues.map((issue) => {
        if (issue.code === 'unrecognized_keys') {
          return {
            field: 'unknown',
            message: `You have provided invalid fields: ${issue.keys.join(', ')}`,
          };
        }
        return {
          field: issue.path.join('.'),
          message: issue.message,
        };
      }),
    );
  }
}
