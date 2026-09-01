import z from "zod";

export const unitsSchema = z.object({
  title: z.string(),
  description: z
    .string()
    .min(3, "unit description should be 3 characters at least"),
  pricePerNight: z.number().positive(),
  maxGuests: z.number().positive(),
  cityId: z.uuid(),
  currencyId: z.uuid(),
  categoryId: z.uuid(),
});

export type unitsDto = z.infer<typeof unitsSchema>;
export type updateUnitsDto = Partial<unitsDto>;

export const listUnitsQuerySchema = z.object({
  cityId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type listUnitsQueryDto = z.infer<typeof listUnitsQuerySchema>;
