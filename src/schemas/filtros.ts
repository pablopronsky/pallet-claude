import { z } from "zod";
import { Sucursal } from "@prisma/client";

// Filtros comunes leídos desde searchParams en URL.
export const filtrosSchema = z
  .object({
    desde: z
      .string()
      .optional()
      .transform((v) => (v && v !== "" ? new Date(v) : undefined)),
    hasta: z
      .string()
      .optional()
      .transform((v) => {
        if (!v || v === "") return undefined;
        // Incluir todo el día final.
        const d = new Date(v);
        d.setHours(23, 59, 59, 999);
        return d;
      }),
    sucursal: z
      .union([z.nativeEnum(Sucursal), z.literal("")])
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    productoId: z
      .string()
      .optional()
      .transform((v) => (v && v !== "" ? v : undefined)),
    tipo: z
      .union([
        z.literal("INGRESO"),
        z.literal("VENTA"),
        z.literal("BAJA"),
        z.literal(""),
      ])
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
  })
  .default({});

export type Filtros = z.infer<typeof filtrosSchema>;
