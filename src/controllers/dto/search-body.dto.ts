import { z } from 'zod';

export const searchBodySchema = z.object({
  itemName: z.string().min(1).max(500),
  itemType: z.enum(['medicine', 'input']),
  dosage: z.string().max(200).optional(),
  measurementUnit: z.string().max(50).optional(),
});

export type SearchBodyDto = z.infer<typeof searchBodySchema>;

export const invalidateCacheBodySchema = searchBodySchema.pick({
  itemName: true,
  itemType: true,
  dosage: true,
});

export type InvalidateCacheBodyDto = z.infer<typeof invalidateCacheBodySchema>;
