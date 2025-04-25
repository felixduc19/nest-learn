import { CreateUserDtoSchema } from 'src/modules/users/dto/create-user.dto';
import { z } from 'zod';

export const LoginDtoSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
  password: z
    .string({
      message: 'Password is required',
    })
    .min(8, {
      message: 'Password must be at least 8 characters',
    }),
});

export const RegisterDtoSchema = CreateUserDtoSchema;

export type LoginDtoType = z.infer<typeof LoginDtoSchema>;
export type RegisterDtoType = z.infer<typeof RegisterDtoSchema>;
