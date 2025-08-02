import z from "zod";

export const transferSchema = z.object({
  to: z
    .string()
    .min(1, { message: "Recipent ID is required and cannot be empty." }),
  amount: z.number().positive({
    message: "Transfer amount must be a positive number.",
  }),
});
