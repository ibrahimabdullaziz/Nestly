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
