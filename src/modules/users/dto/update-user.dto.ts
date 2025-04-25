import { z } from 'zod';
import { UserDtoSchema } from './user.dto';

const UpdateUserDtoSchema = UserDtoSchema.omit({
  email: true,
  isActive: true,
  accountType: true,
})
  .partial()
  .strict();

type UpdateUserDtoType = z.infer<typeof UpdateUserDtoSchema>;

export { UpdateUserDtoSchema, UpdateUserDtoType };
