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

export const VerifyOTPSchema = z.object({
  otp: z.string({ message: 'OTP is required' }).min(6, {
    message: 'OTP must be at least 6 characters',
  }),
  email: z.string({ message: 'Email is required' }).email(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
});

export const VerifyForgotPasswordSchema = z.object({
  key: z.string({ message: 'Key is required' }),
});

export const ResetPasswordSchema = VerifyForgotPasswordSchema.extend({
  password: z
    .string({
      message: 'Password is required',
    })
    .min(8, {
      message: 'Password must be at least 8 characters',
    }),
});

export type LoginDtoType = z.infer<typeof LoginDtoSchema>;
export type RegisterDtoType = z.infer<typeof RegisterDtoSchema>;
export type VerifyOTPType = z.infer<typeof VerifyOTPSchema>;
export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;
export type VerifyForgotPasswordType = z.infer<
  typeof VerifyForgotPasswordSchema
>;

export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
