import { z } from "zod";
import { Sucursal, Moneda } from "@prisma/client";

const sucursalEnum = z.nativeEnum(Sucursal);
const monedaEnum = z.nativeEnum(Moneda);

export const crearIngresoSchema = z
  .object({
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
    moneda: monedaEnum.default(Moneda.ARS),
    tipoCambio: z
      .union([z.literal(""), z.coerce.number().positive()])
      .optional()
      .transform((v) => (typeof v === "number" ? v : undefined)),
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
    if (data.moneda === "USD" && (!data.tipoCambio || data.tipoCambio <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoCambio"],
        message: "Indicá el tipo de cambio (ARS por USD)",
      });
    }
  });

export type CrearIngresoInput = z.infer<typeof crearIngresoSchema>;
