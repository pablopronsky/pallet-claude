import { z } from "zod";
import { Sucursal, Motivo } from "@prisma/client";

export const crearBajaSchema = z.object({
  productoId: z
    .string({ required_error: "Elegí un producto" })
    .min(1, "Elegí un producto"),
  sucursal: z.nativeEnum(Sucursal),
  cantidadCajas: z.coerce
    .number({ invalid_type_error: "Ingresá un número" })
    .int("Debe ser un número entero de cajas")
    .positive("Debe ser mayor a cero"),
  motivo: z.nativeEnum(Motivo, {
    errorMap: () => ({ message: "Elegí un motivo" }),
  }),
  fecha: z.coerce
    .date()
    .optional()
    .refine((d) => !d || d <= new Date(), {
      message: "La fecha no puede ser futura",
    }),
  notas: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .transform((s) => (s && s.trim() !== "" ? s.trim() : undefined)),
});

export type CrearBajaInput = z.infer<typeof crearBajaSchema>;
