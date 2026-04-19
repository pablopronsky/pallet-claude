"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearLiquidacionSchema } from "@/schemas/liquidacion";
import type { ActionState } from "@/server/actions/usuarios";

export async function crearLiquidacionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return {
      ok: false,
      error: "Solo el administrador puede registrar liquidaciones.",
    };
  }

  const parsed = crearLiquidacionSchema.safeParse({
    monto: String(formData.get("monto") ?? ""),
    moneda: String(formData.get("moneda") ?? "ARS"),
    tipoCambio: String(formData.get("tipoCambio") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
    comprobante: String(formData.get("comprobante") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.liquidacion.create({
    data: {
      monto: parsed.data.monto,
      moneda: parsed.data.moneda,
      tipoCambio: parsed.data.tipoCambio ?? null,
      fecha: parsed.data.fecha ?? new Date(),
      comprobante: parsed.data.comprobante,
      notas: parsed.data.notas,
      adminId: session.user.id,
    },
  });

  revalidatePath("/liquidaciones");
  revalidatePath("/dashboard");
  revalidateTag("liquidaciones");
  redirect("/liquidaciones?ok=1");
}
