"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  crearProductoSchema,
  editarProductoSchema,
} from "@/schemas/producto";
import type { ActionState } from "@/server/actions/usuarios";

async function soloAdmin(): Promise<ActionState | null> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return { ok: false, error: "No tenés permiso para esta acción." };
  }
  return null;
}

export async function crearProductoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const bloqueo = await soloAdmin();
  if (bloqueo) return bloqueo;

  const parsed = crearProductoSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existente = await prisma.producto.findUnique({
    where: { nombre: parsed.data.nombre },
  });
  if (existente) {
    return {
      ok: false,
      error: "Ya existe un producto con ese nombre.",
      fieldErrors: { nombre: ["Nombre duplicado"] },
    };
  }

  await prisma.producto.create({ data: { nombre: parsed.data.nombre } });
  revalidatePath("/productos");

  return { ok: true, mensaje: "Producto creado." };
}

export async function editarProductoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const bloqueo = await soloAdmin();
  if (bloqueo) return bloqueo;

  const parsed = editarProductoSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    nombre: String(formData.get("nombre") ?? ""),
    activo: String(formData.get("activo") ?? "false") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const otro = await prisma.producto.findFirst({
    where: { nombre: parsed.data.nombre, NOT: { id: parsed.data.id } },
    select: { id: true },
  });
  if (otro) {
    return {
      ok: false,
      error: "Ya existe otro producto con ese nombre.",
      fieldErrors: { nombre: ["Nombre duplicado"] },
    };
  }

  await prisma.producto.update({
    where: { id: parsed.data.id },
    data: { nombre: parsed.data.nombre, activo: parsed.data.activo },
  });
  revalidatePath("/productos");

  return { ok: true, mensaje: "Producto actualizado." };
}
