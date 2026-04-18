import { z } from "zod";

// Registro de una venta. La sucursal se toma del usuario logueado (no se envía).
// La asignación a uno o varios ingresos se hace en el servidor usando FIFO.
export const crearVentaSchema = z.object({
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
  fecha: z.coerce.date().optional(),
  notas: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .transform((s) => (s && s.trim() !== "" ? s.trim() : undefined)),
});

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
