import z from "zod";

export const citySchema = z.object({
  name: z.string().min(3, "Country name should be 3 characters at least "),
  countryId: z.string().uuid(),
});

export type CityDto = z.infer<typeof citySchema>;
