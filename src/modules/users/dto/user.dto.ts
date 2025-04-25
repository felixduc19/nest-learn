import { Types } from 'mongoose';
import { z } from 'zod';

const objectIdSchema = z
  .custom<Types.ObjectId>(
    (val: string) => {
      return Types.ObjectId.isValid(val);
    },
    {
      message: 'Invalid ObjectId',
    },
  )
  .optional();

export const UserDtoSchema = z.object({
  name: z
    .string({ message: 'Name must be a string' })
    .nonempty('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50),
  email: z.string().email().readonly(),

  role: z.enum(['USER', 'ADMIN']).default('USER').readonly(),
  isActive: z.boolean().default(false).readonly(),
  phone: z.string().optional().default(''),
  address: z.string().optional(),
  image: z.string().optional(),
  accountType: z.enum(['LOCAL', 'GOOGLE']).default('LOCAL').readonly(),
  code: z.string().optional().readonly(),
  codeExpire: z.date().optional().readonly(),
});

export const TransformUserDtoSchema = UserDtoSchema.extend({
  _id: objectIdSchema,
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).transform((data) => {
  return {
    ...data,
    id: data._id?.toString(),
    _id: undefined,
  };
});

export type UserDtoType = z.infer<typeof UserDtoSchema>;
export type TransformUserDtoType = z.infer<typeof TransformUserDtoSchema>;
