import "server-only";

import { unstable_cache } from "next/cache";
import { Sucursal, Motivo } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Filtros } from "@/schemas/filtros";

export type Movimiento = {
  id: string;
  tipo: "INGRESO" | "VENTA" | "BAJA";
  fecha: Date;
  productoId: string;
  productoNombre: string;
  sucursal: Sucursal;
  cantidadCajas: number;
  precioUnitario: number | null;
  total: number | null;
  usuarioNombre: string;
  motivo: Motivo | null;
  notas: string | null;
};

type Opts = Filtros & {
  sucursalForzada?: Sucursal; // cuando el rol es VENDEDOR, forzamos su sucursal
};

async function _getMovimientos(opts: Opts): Promise<Movimiento[]> {
  const sucursal = opts.sucursalForzada ?? opts.sucursal;

  const rangoFecha =
    opts.desde || opts.hasta
      ? {
          fecha: {
            ...(opts.desde ? { gte: opts.desde } : {}),
            ...(opts.hasta ? { lte: opts.hasta } : {}),
          },
        }
      : {};

  const whereComun = {
    ...(sucursal ? { sucursal } : {}),
    ...(opts.productoId ? { productoId: opts.productoId } : {}),
    ...rangoFecha,
  };

  const wantIngreso = !opts.tipo || opts.tipo === "INGRESO";
  const wantVenta = !opts.tipo || opts.tipo === "VENTA";
  const wantBaja = !opts.tipo || opts.tipo === "BAJA";

  const [ingresos, ventas, bajas] = await Promise.all([
    wantIngreso
      ? prisma.ingreso.findMany({
          where: whereComun,
          include: {
            producto: { select: { nombre: true } },
            admin: { select: { nombre: true } },
          },
          orderBy: { fecha: "desc" },
        })
      : Promise.resolve([]),
    wantVenta
      ? prisma.venta.findMany({
          where: whereComun,
          include: {
            producto: { select: { nombre: true } },
            user: { select: { nombre: true } },
          },
          orderBy: { fecha: "desc" },
        })
      : Promise.resolve([]),
    wantBaja
      ? prisma.baja.findMany({
          where: whereComun,
          include: {
            producto: { select: { nombre: true } },
            admin: { select: { nombre: true } },
          },
          orderBy: { fecha: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const list: Movimiento[] = [];

  for (const i of ingresos) {
    const costo = Number(i.precioCostoPorCaja);
    list.push({
      id: `ING-${i.id}`,
      tipo: "INGRESO",
      fecha: i.fecha,
      productoId: i.productoId,
      productoNombre: i.producto.nombre,
      sucursal: i.sucursal,
      cantidadCajas: i.cantidadCajas,
      precioUnitario: costo,
      total: costo * i.cantidadCajas,
      usuarioNombre: i.admin.nombre,
      motivo: null,
      notas: i.notas,
    });
  }
  for (const v of ventas) {
    const precio = Number(v.precioVentaPorCaja);
    list.push({
      id: `VEN-${v.id}`,
      tipo: "VENTA",
      fecha: v.fecha,
      productoId: v.productoId,
      productoNombre: v.producto.nombre,
      sucursal: v.sucursal,
      cantidadCajas: v.cantidadCajas,
      precioUnitario: precio,
      total: precio * v.cantidadCajas,
      usuarioNombre: v.user.nombre,
      motivo: null,
      notas: v.notas,
    });
  }
  for (const b of bajas) {
    list.push({
      id: `BAJ-${b.id}`,
      tipo: "BAJA",
      fecha: b.fecha,
      productoId: b.productoId,
      productoNombre: b.producto.nombre,
      sucursal: b.sucursal,
      cantidadCajas: b.cantidadCajas,
      precioUnitario: null,
      total: null,
      usuarioNombre: b.admin.nombre,
      motivo: b.motivo,
      notas: b.notas,
    });
  }

  list.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  return list;
}

export const getMovimientos = unstable_cache(
  _getMovimientos,
  ["movimientos"],
  { tags: ["movimientos", "ingresos", "ventas", "bajas"], revalidate: 60 },
);
