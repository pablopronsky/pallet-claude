import { z } from "zod";

const stockMinimoField = z.coerce
  .number({ invalid_type_error: "Ingresá un número" })
  .int("Debe ser un número entero")
  .min(0, "No puede ser negativo")
  .default(0);

export const crearProductoSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .transform((s) => s.trim()),
  stockMinimo: stockMinimoField,
});

export const editarProductoSchema = z.object({
  id: z.string().min(1),
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .transform((s) => s.trim()),
  activo: z.coerce.boolean().default(true),
  stockMinimo: stockMinimoField,
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type EditarProductoInput = z.infer<typeof editarProductoSchema>;
