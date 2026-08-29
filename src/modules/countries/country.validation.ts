import z from "zod";

export const countrySchema = z.object({
  name: z.string().min(3, "Country name should be 3 characters at least "),
  code: z.string(),
});

export type CountryDto = z.infer<typeof countrySchema>;
