import { z } from "zod";

export const moderatorLoginSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your moderator name.")
    .max(255, "Name is too long.")
    .regex(/^[a-zA-Z0-9 _.-]+$/, "Name contains invalid characters."),
  password: z
    .string()
    .min(1, "Please enter your password.")
    .max(128, "Password is too long."),
});

export type ModeratorLoginInput = z.infer<typeof moderatorLoginSchema>;
