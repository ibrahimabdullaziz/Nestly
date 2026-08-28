import z from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().length(8),
});
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().length(8),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
