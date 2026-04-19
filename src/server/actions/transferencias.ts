"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearTransferenciaSchema } from "@/schemas/transferencia";
import type { ActionState } from "@/server/actions/usuarios";

export async function crearTransferenciaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return {
      ok: false,
      error: "Solo el administrador puede registrar transferencias.",
    };
  }

  const parsed = crearTransferenciaSchema.safeParse({
    productoId: String(formData.get("productoId") ?? ""),
    sucursalOrigen: String(formData.get("sucursalOrigen") ?? ""),
    sucursalDestino: String(formData.get("sucursalDestino") ?? ""),
    cantidadCajas: String(formData.get("cantidadCajas") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    productoId,
    sucursalOrigen,
    sucursalDestino,
    cantidadCajas,
    fecha,
    notas,
  } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // FIFO sobre los ingresos del producto en la sucursal origen,
      // descontando ventas y transferencias salientes previas por ingreso.
      const ingresos = await tx.ingreso.findMany({
        where: { productoId, sucursal: sucursalOrigen },
        orderBy: { fecha: "asc" },
        include: {
          ventas: { select: { cantidadCajas: true } },
          transferenciasOrigen: { select: { cantidadCajas: true } },
        },
      });

      const disponiblePorIngreso = ingresos.map((ing) => {
        const vendidas = ing.ventas.reduce((a, v) => a + v.cantidadCajas, 0);
        const transferidas = ing.transferenciasOrigen.reduce(
          (a, t) => a + t.cantidadCajas,
          0,
        );
        return {
          ing,
          libre: ing.cantidadCajas - vendidas - transferidas,
        };
      });

      const totalDisponible = disponiblePorIngreso.reduce(
        (a, x) => a + Math.max(0, x.libre),
        0,
      );
      if (totalDisponible < cantidadCajas) {
        throw new Error(
          `Stock insuficiente en origen. Disponibles: ${totalDisponible} cajas.`,
        );
      }

      const fechaTransfer = fecha ?? new Date();
      let restan = cantidadCajas;

      for (const { ing, libre } of disponiblePorIngreso) {
        if (restan <= 0) break;
        if (libre <= 0) continue;
        const tomar = Math.min(libre, restan);

        // Clon de ingreso en destino, preservando costo/moneda/TC originales.
        const clon = await tx.ingreso.create({
          data: {
            productoId,
            sucursal: sucursalDestino,
            cantidadCajas: tomar,
            precioCostoPorCaja: ing.precioCostoPorCaja,
            moneda: ing.moneda,
            tipoCambio: ing.tipoCambio,
            origen: "TRANSFERENCIA",
            fecha: fechaTransfer,
            adminId: session.user.id,
            notas: notas
              ? `Transferencia desde ${sucursalOrigen}: ${notas}`
              : `Transferencia desde ${sucursalOrigen}`,
          },
        });

        await tx.transferencia.create({
          data: {
            productoId,
            sucursalOrigen,
            sucursalDestino,
            cantidadCajas: tomar,
            fecha: fechaTransfer,
            adminId: session.user.id,
            notas,
            ingresoOrigenId: ing.id,
            ingresoDestinoId: clon.id,
          },
        });

        restan -= tomar;
      }

      if (restan > 0) {
        throw new Error("No se pudo asignar la transferencia al stock origen.");
      }
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al registrar la transferencia.";
    return { ok: false, error: msg };
  }

  revalidatePath("/transferencias");
  revalidatePath("/stock");
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  revalidateTag("ingresos");
  revalidateTag("stock");
  redirect("/transferencias?ok=1");
}
