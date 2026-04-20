"use server";

import { revalidatePath, updateTag } from "next/cache";
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

  const parsed = crearVentaSchema.safeParse({
    sucursal: String(formData.get("sucursal") ?? "") || undefined,
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

  // Admin elige sucursal en el form (ya validada como enum); vendedor usa la propia.
  const sucursal =
    user.rol === "ADMIN" ? parsed.data.sucursal : user.sucursal;

  if (!sucursal) {
    return {
      ok: false,
      error:
        user.rol === "ADMIN"
          ? "Elegí una sucursal."
          : "No se pudo determinar la sucursal de la venta.",
      ...(user.rol === "ADMIN"
        ? { fieldErrors: { sucursal: ["Elegí una sucursal"] } }
        : {}),
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

  // Transacción serializable para evitar overselling bajo carga concurrente.
  const runTx = () =>
    prisma.$transaction(
      async (tx) => {
        const producto = await tx.producto.findUnique({
          where: { id: productoId, activo: true },
          select: { id: true },
        });
        if (!producto) throw new Error("El producto no está disponible.");

        // Stock disponible incluye los ingresos clonados por transferencias entrantes
        // y descuenta los que salieron por transferencia desde esta sucursal.
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
          throw new Error(`Stock insuficiente. Disponibles: ${disponible} cajas.`);
        }

        // Consumo FIFO: descontando ventas previas y transferencias salientes por ingreso.
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
          throw new Error(
            "No se pudo asignar la venta a lotes disponibles. Revisá el stock.",
          );
        }
      },
      { isolationLevel: "Serializable" },
    );

  try {
    let attempts = 3;
    while (attempts--) {
      try {
        await runTx();
        break;
      } catch (err) {
        const isSerializationError =
          err instanceof Error &&
          "code" in err &&
          (err as { code: string }).code === "P2034";
        if (isSerializationError && attempts > 0) {
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al registrar la venta.";
    return { ok: false, error: msg };
  }

  revalidatePath("/ventas");
  revalidatePath("/stock");
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  updateTag("ventas");
  redirect("/ventas?ok=1");
}
