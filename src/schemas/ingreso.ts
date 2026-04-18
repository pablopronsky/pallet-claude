import { z } from "zod";
import { Sucursal } from "@prisma/client";

const sucursalEnum = z.nativeEnum(Sucursal);

export const crearIngresoSchema = z.object({
  productoId: z
    .string({ required_error: "Elegí un producto" })
    .min(1, "Elegí un producto"),
  sucursal: sucursalEnum,
  cantidadCajas: z.coerce
    .number({ invalid_type_error: "Ingresá un número" })
    .int("Debe ser un número entero de cajas")
    .positive("Debe ser mayor a cero"),
  precioCostoPorCaja: z.coerce
    .number({ invalid_type_error: "Ingresá un precio válido" })
    .positive("Debe ser mayor a cero"),
  fecha: z.coerce.date().optional(),
  notas: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .transform((s) => (s && s.trim() !== "" ? s.trim() : undefined)),
});

export type CrearIngresoInput = z.infer<typeof crearIngresoSchema>;
