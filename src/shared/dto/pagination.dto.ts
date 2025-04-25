import { z } from 'zod';

const DEFAULT_PAGE = '1';
const DEFAULT_LIMIT = '10';

export const PaginationDtoSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => val ?? DEFAULT_PAGE)
    .refine(
      (val) => {
        const page = Number(val);
        return page > 0;
      },
      {
        message: 'Page must be a positive number',
      },
    ),

  limit: z
    .string()
    .optional()
    .transform((val) => val ?? DEFAULT_LIMIT)
    .refine(
      (val) => {
        const limit = Number(val);
        return limit > 0;
      },
      {
        message: 'Limit must be a positive number',
      },
    ),
  /**
   * @TODO: Add sorting and filtering
   */
});

export type PaginationDtoType = z.infer<typeof PaginationDtoSchema>;
