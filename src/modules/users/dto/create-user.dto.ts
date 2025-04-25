import { z } from 'zod';
import { UserDtoSchema } from './user.dto';

export const CreateUserDtoSchema = UserDtoSchema.extend({
  password: z.string().min(8),
});

export type CreateUserDtoType = z.infer<typeof CreateUserDtoSchema>;
