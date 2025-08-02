import z from "zod";

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "First name must be at least 3 characters long" }),
  lastName: z
    .string()
    .min(3, { message: "Last name must be at least 3 characters long" }),
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password too easy" }),
});

export const signinSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const updateSchema = z.object({
  firstName: z.string().min(3).optional(),
  lastName: z.string().optional(),
  password: z.string().min(6).optional(),
});
