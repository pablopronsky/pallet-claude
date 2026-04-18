import { z } from "zod";

// Edición de un slot existente de usuario. El admin solo puede editar los datos
// (nombre, email, contraseña). El rol y la sucursal son fijos por slot.
export const editarUsuarioSchema = z
  .object({
    id: z.string().min(1),
    nombre: z
      .string({ required_error: "El nombre es obligatorio" })
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "El nombre es demasiado largo"),
    email: z
      .string({ required_error: "El email es obligatorio" })
      .email("Ingresá un email válido"),
    password: z
      .union([
        z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        z.literal(""),
      ])
      .optional(),
  })
  .strict();

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
