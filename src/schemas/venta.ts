import { z } from "zod";
import { Moneda } from "@prisma/client";

const monedaEnum = z.nativeEnum(Moneda);

// Registro de una venta. La sucursal se toma del usuario logueado (no se envía).
// La asignación a uno o varios ingresos se hace en el servidor usando FIFO.
export const crearVentaSchema = z
  .object({
    productoId: z
      .string({ required_error: "Elegí un producto" })
      .min(1, "Elegí un producto"),
    cantidadCajas: z.coerce
      .number({ invalid_type_error: "Ingresá un número" })
      .int("Debe ser un número entero de cajas")
      .positive("Debe ser mayor a cero"),
    precioVentaPorCaja: z.coerce
      .number({ invalid_type_error: "Ingresá un precio válido" })
      .positive("Debe ser mayor a cero"),
    moneda: monedaEnum.default(Moneda.ARS),
    tipoCambio: z
      .union([z.literal(""), z.coerce.number().positive()])
      .optional()
      .transform((v) => (typeof v === "number" ? v : undefined)),
    fecha: z.coerce.date().optional(),
    notas: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .transform((s) => (s && s.trim() !== "" ? s.trim() : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.moneda === "USD" && (!data.tipoCambio || data.tipoCambio <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoCambio"],
        message: "Indicá el tipo de cambio (ARS por USD)",
      });
    }
  });

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
