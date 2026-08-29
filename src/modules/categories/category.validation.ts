import z from "zod";

export const categorySchema = z.object({
  name: z.string().min(3, "category name should be 3 characters at least "),
});

export type CategoryDto = z.infer<typeof categorySchema>;
