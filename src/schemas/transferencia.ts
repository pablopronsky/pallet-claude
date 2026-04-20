import { z } from "zod";
import { Sucursal } from "@prisma/client";

const sucursalEnum = z.nativeEnum(Sucursal);

export const crearTransferenciaSchema = z
  .object({
    productoId: z
      .string({ required_error: "Elegí un producto" })
      .min(1, "Elegí un producto"),
    sucursalOrigen: sucursalEnum,
    sucursalDestino: sucursalEnum,
    cantidadCajas: z.coerce
      .number({ invalid_type_error: "Ingresá un número" })
      .int("Debe ser un número entero de cajas")
      .positive("Debe ser mayor a cero"),
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
  })
  .superRefine((data, ctx) => {
    if (data.sucursalOrigen === data.sucursalDestino) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sucursalDestino"],
        message: "El destino debe ser distinto al origen",
      });
    }
  });

export type CrearTransferenciaInput = z.infer<typeof crearTransferenciaSchema>;
