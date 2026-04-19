"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { editarUsuarioSchema, crearUsuarioSchema } from "@/schemas/usuario";

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  mensaje?: string;
};

export async function editarUsuarioAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return { ok: false, error: "No tenés permiso para esta acción." };
  }

  const raw = {
    id: String(formData.get("id") ?? ""),
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = editarUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existente = await prisma.user.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existente) {
    return { ok: false, error: "El usuario no existe." };
  }

  const otroConEseEmail = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: parsed.data.id } },
    select: { id: true },
  });
  if (otroConEseEmail) {
    return {
      ok: false,
      error: "Ya existe otro usuario con ese email.",
      fieldErrors: { email: ["Email en uso por otro usuario"] },
    };
  }

  const data: {
    nombre: string;
    email: string;
    password?: string;
  } = {
    nombre: parsed.data.nombre,
    email: parsed.data.email,
  };
  if (parsed.data.password && parsed.data.password !== "") {
    data.password = await bcrypt.hash(parsed.data.password, 10);
  }

  await prisma.user.update({ where: { id: parsed.data.id }, data });
  revalidatePath("/usuarios");

  return { ok: true, mensaje: "Usuario actualizado correctamente." };
}

export async function crearUsuarioLogisticaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return { ok: false, error: "No tenés permiso para esta acción." };
  }

  const parsed = crearUsuarioSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existe = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existe) {
    return {
      ok: false,
      error: "Ya existe un usuario con ese email.",
      fieldErrors: { email: ["Email en uso"] },
    };
  }

  const hash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      password: hash,
      rol: "LOGISTICA",
      sucursal: null,
    },
  });
  revalidatePath("/usuarios");

  return { ok: true, mensaje: "Usuario de logística creado correctamente." };
}
