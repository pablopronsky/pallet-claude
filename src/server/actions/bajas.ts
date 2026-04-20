"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearBajaSchema } from "@/schemas/baja";
import type { ActionState } from "@/server/actions/usuarios";

export async function crearBajaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return { ok: false, error: "Solo el administrador puede registrar bajas." };
  }

  const parsed = crearBajaSchema.safeParse({
    productoId: String(formData.get("productoId") ?? ""),
    sucursal: String(formData.get("sucursal") ?? ""),
    cantidadCajas: String(formData.get("cantidadCajas") ?? ""),
    motivo: String(formData.get("motivo") ?? ""),
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

  const { productoId, sucursal, cantidadCajas, motivo, fecha, notas } =
    parsed.data;

  const runTx = () =>
    prisma.$transaction(
      async (tx) => {
        const [ingAgg, venAgg, bajAgg, transAgg] = await Promise.all([
          tx.ingreso.aggregate({
            where: { productoId, sucursal },
            _sum: { cantidadCajas: true },
          }),
          tx.venta.aggregate({
            where: { productoId, sucursal },
            _sum: { cantidadCajas: true },
          }),
          tx.baja.aggregate({
            where: { productoId, sucursal },
            _sum: { cantidadCajas: true },
          }),
          tx.transferencia.aggregate({
            where: { productoId, sucursalOrigen: sucursal },
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
            `Stock insuficiente para dar de baja. Disponibles: ${disponible} cajas.`,
          );
        }

        await tx.baja.create({
          data: {
            productoId,
            sucursal,
            cantidadCajas,
            motivo,
            fecha: fecha ?? new Date(),
            adminId: session.user.id,
            notas,
          },
        });
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
    const msg = err instanceof Error ? err.message : "Error al registrar la baja.";
    return { ok: false, error: msg };
  }

  revalidatePath("/bajas");
  revalidatePath("/stock");
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  updateTag("bajas");
  redirect("/bajas?ok=1");
}
