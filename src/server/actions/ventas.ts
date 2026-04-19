"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearVentaSchema } from "@/schemas/venta";
import type { ActionState } from "@/server/actions/usuarios";

export async function crearVentaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Sesión expirada, ingresá de nuevo." };
  }

  const user = session.user;

  // Admin necesita elegir sucursal en el form; vendedor usa su propia sucursal.
  let sucursal = user.sucursal;
  if (user.rol === "ADMIN") {
    const sucursalForm = String(formData.get("sucursal") ?? "");
    if (!sucursalForm) {
      return {
        ok: false,
        error: "Elegí una sucursal.",
        fieldErrors: { sucursal: ["Elegí una sucursal"] },
      };
    }
    sucursal = sucursalForm as typeof sucursal;
  }
  if (!sucursal) {
    return {
      ok: false,
      error: "No se pudo determinar la sucursal de la venta.",
    };
  }

  const parsed = crearVentaSchema.safeParse({
    productoId: String(formData.get("productoId") ?? ""),
    cantidadCajas: String(formData.get("cantidadCajas") ?? ""),
    precioVentaPorCaja: String(formData.get("precioVentaPorCaja") ?? ""),
    moneda: String(formData.get("moneda") ?? "ARS"),
    tipoCambio: String(formData.get("tipoCambio") ?? ""),
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
    cantidadCajas,
    precioVentaPorCaja,
    moneda,
    tipoCambio,
    fecha,
    notas,
  } = parsed.data;

  // Todo dentro de una transacción para evitar vender más de lo que hay.
  try {
    await prisma.$transaction(async (tx) => {
      // Stock disponible incluye los ingresos clonados por transferencias entrantes
      // (origen=TRANSFERENCIA en ingreso ya situado en la sucursal destino) y
      // descuenta las cajas que salieron por transferencia desde esta sucursal.
      const [ingAgg, venAgg, bajAgg, transAgg] = await Promise.all([
        tx.ingreso.aggregate({
          where: { productoId, sucursal: sucursal! },
          _sum: { cantidadCajas: true },
        }),
        tx.venta.aggregate({
          where: { productoId, sucursal: sucursal! },
          _sum: { cantidadCajas: true },
        }),
        tx.baja.aggregate({
          where: { productoId, sucursal: sucursal! },
          _sum: { cantidadCajas: true },
        }),
        tx.transferencia.aggregate({
          where: { productoId, sucursalOrigen: sucursal! },
          _sum: { cantidadCajas: true },
        }),
      ]);
      const disponible =
        (ingAgg._sum.cantidadCajas ?? 0) -
        (venAgg._sum.cantidadCajas ?? 0) -
        (bajAgg._sum.cantidadCajas ?? 0) -
        (transAgg._sum.cantidadCajas ?? 0);

      if (disponible < cantidadCajas) {
        throw new Error(
          `Stock insuficiente. Disponibles: ${disponible} cajas.`,
        );
      }

      // Consumo FIFO sobre ingresos con stock propio remanente,
      // descontando ventas previas y transferencias salientes por ingreso.
      const ingresos = await tx.ingreso.findMany({
        where: { productoId, sucursal: sucursal! },
        orderBy: { fecha: "asc" },
        include: {
          ventas: { select: { cantidadCajas: true } },
          transferenciasOrigen: { select: { cantidadCajas: true } },
        },
      });

      let restan = cantidadCajas;
      const fechaVenta = fecha ?? new Date();

      for (const ing of ingresos) {
        if (restan <= 0) break;
        const ya = ing.ventas.reduce((a, v) => a + v.cantidadCajas, 0);
        const transferidas = ing.transferenciasOrigen.reduce(
          (a, t) => a + t.cantidadCajas,
          0,
        );
        const libres = ing.cantidadCajas - ya - transferidas;
        if (libres <= 0) continue;

        const tomar = Math.min(libres, restan);
        await tx.venta.create({
          data: {
            productoId,
            ingresoId: ing.id,
            sucursal: sucursal!,
            cantidadCajas: tomar,
            precioVentaPorCaja,
            moneda,
            tipoCambio: tipoCambio ?? null,
            fecha: fechaVenta,
            userId: user.id,
            notas,
          },
        });
        restan -= tomar;
      }

      if (restan > 0) {
        // No debería ocurrir si la validación anterior es correcta, pero
        // cubrimos el edge case (por ejemplo, bajas recientes sin FIFO).
        throw new Error(
          "No se pudo asignar la venta a lotes disponibles. Revisá el stock.",
        );
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al registrar la venta.";
    return { ok: false, error: msg };
  }

  revalidatePath("/ventas");
  revalidatePath("/stock");
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  revalidateTag("ventas", "max");
  redirect("/ventas?ok=1");
}
