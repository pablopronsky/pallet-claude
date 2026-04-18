import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "El email es obligatorio" })
    .min(1, "El email es obligatorio")
    .email("Ingresá un email válido"),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;
