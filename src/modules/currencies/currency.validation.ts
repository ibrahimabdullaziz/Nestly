import z from "zod";

export const currencySchema = z.object({
  code: z.string(),
  symbol: z.string(),
});

export type CurrencyDto = z.infer<typeof currencySchema>;
