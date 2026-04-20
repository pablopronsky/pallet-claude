"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearIngresoSchema } from "@/schemas/ingreso";
import type { ActionState } from "@/server/actions/usuarios";

export async function crearIngresoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return { ok: false, error: "Solo el administrador puede registrar ingresos." };
  }

  const raw = {
    productoId: String(formData.get("productoId") ?? ""),
    sucursal: String(formData.get("sucursal") ?? ""),
    cantidadCajas: String(formData.get("cantidadCajas") ?? ""),
    precioCostoPorCaja: String(formData.get("precioCostoPorCaja") ?? ""),
    moneda: String(formData.get("moneda") ?? "ARS"),
    tipoCambio: String(formData.get("tipoCambio") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  };

  const parsed = crearIngresoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const producto = await prisma.producto.findUnique({
    where: { id: parsed.data.productoId },
  });
  if (!producto || !producto.activo) {
    return {
      ok: false,
      error: "El producto seleccionado no está disponible.",
    };
  }

  await prisma.ingreso.create({
    data: {
      productoId: parsed.data.productoId,
      sucursal: parsed.data.sucursal,
      cantidadCajas: parsed.data.cantidadCajas,
      precioCostoPorCaja: parsed.data.precioCostoPorCaja,
      moneda: parsed.data.moneda,
      tipoCambio: parsed.data.tipoCambio ?? null,
      fecha: parsed.data.fecha ?? new Date(),
      adminId: session.user.id,
      notas: parsed.data.notas,
    },
  });

  revalidatePath("/ingresos");
  revalidatePath("/stock");
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  updateTag("ingresos");
  redirect("/ingresos?ok=1");
}
