import { z } from "zod";
import { Moneda } from "@prisma/client";

const monedaEnum = z.nativeEnum(Moneda);

export const crearLiquidacionSchema = z
  .object({
    monto: z.coerce
      .number({ invalid_type_error: "Ingresá un monto válido" })
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
    comprobante: z
      .string()
      .max(120, "Máximo 120 caracteres")
      .optional()
      .transform((s) => (s && s.trim() !== "" ? s.trim() : undefined)),
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

export type CrearLiquidacionInput = z.infer<typeof crearLiquidacionSchema>;
