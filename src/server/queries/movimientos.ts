import "server-only";

import { unstable_cache } from "next/cache";
import { Sucursal, Motivo } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { montoEnARS } from "@/lib/format";
import { SUCURSAL_LABEL } from "@/lib/constants";
import type { Filtros } from "@/schemas/filtros";

export type MovimientoTipo =
  | "INGRESO"
  | "VENTA"
  | "BAJA"
  | "TRANSFERENCIA"
  | "LIQUIDACION";

export type Movimiento = {
  id: string;
  tipo: MovimientoTipo;
  fecha: Date;
  productoId: string | null;
  productoNombre: string;
  sucursal: Sucursal | null;
  sucursalDestino: Sucursal | null;
  cantidadCajas: number | null;
  precioUnitario: number | null;
  total: number | null;
  usuarioNombre: string;
  motivo: Motivo | null;
  notas: string | null;
};

type Opts = Filtros & {
  sucursalForzada?: Sucursal;
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
  const wantTransf = !opts.tipo || opts.tipo === "TRANSFERENCIA";
  const wantLiq = !opts.tipo || opts.tipo === "LIQUIDACION";

  // Filtro de transferencias: la sucursal puede coincidir en origen o destino.
  const whereTransf = {
    ...(opts.productoId ? { productoId: opts.productoId } : {}),
    ...rangoFecha,
    ...(sucursal
      ? {
          OR: [{ sucursalOrigen: sucursal }, { sucursalDestino: sucursal }],
        }
      : {}),
  };

  // Liquidaciones: globales (sin sucursal). Si hay filtro de sucursal o producto, no aplican.
  const whereLiq = sucursal || opts.productoId ? null : rangoFecha;

  const [ingresos, ventas, bajas, transferencias, liquidaciones] =
    await Promise.all([
      wantIngreso
        ? prisma.ingreso.findMany({
            where: { ...whereComun, origen: "PROVEEDOR" },
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
      wantTransf
        ? prisma.transferencia.findMany({
            where: whereTransf,
            include: {
              producto: { select: { nombre: true } },
              admin: { select: { nombre: true } },
            },
            orderBy: { fecha: "desc" },
          })
        : Promise.resolve([]),
      wantLiq && whereLiq !== null
        ? prisma.liquidacion.findMany({
            where: whereLiq,
            include: { admin: { select: { nombre: true } } },
            orderBy: { fecha: "desc" },
          })
        : Promise.resolve([]),
    ]);

  const list: Movimiento[] = [];

  for (const i of ingresos) {
    const costoARS = montoEnARS(i.precioCostoPorCaja, i.moneda, i.tipoCambio);
    list.push({
      id: `ING-${i.id}`,
      tipo: "INGRESO",
      fecha: i.fecha,
      productoId: i.productoId,
      productoNombre: i.producto.nombre,
      sucursal: i.sucursal,
      sucursalDestino: null,
      cantidadCajas: i.cantidadCajas,
      precioUnitario: costoARS,
      total: costoARS * i.cantidadCajas,
      usuarioNombre: i.admin.nombre,
      motivo: null,
      notas: i.notas,
    });
  }
  for (const v of ventas) {
    const precioARS = montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio);
    list.push({
      id: `VEN-${v.id}`,
      tipo: "VENTA",
      fecha: v.fecha,
      productoId: v.productoId,
      productoNombre: v.producto.nombre,
      sucursal: v.sucursal,
      sucursalDestino: null,
      cantidadCajas: v.cantidadCajas,
      precioUnitario: precioARS,
      total: precioARS * v.cantidadCajas,
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
      sucursalDestino: null,
      cantidadCajas: b.cantidadCajas,
      precioUnitario: null,
      total: null,
      usuarioNombre: b.admin.nombre,
      motivo: b.motivo,
      notas: b.notas,
    });
  }
  for (const t of transferencias) {
    list.push({
      id: `TRA-${t.id}`,
      tipo: "TRANSFERENCIA",
      fecha: t.fecha,
      productoId: t.productoId,
      productoNombre: t.producto.nombre,
      sucursal: t.sucursalOrigen,
      sucursalDestino: t.sucursalDestino,
      cantidadCajas: t.cantidadCajas,
      precioUnitario: null,
      total: null,
      usuarioNombre: t.admin.nombre,
      motivo: null,
      notas:
        t.notas ??
        `→ ${SUCURSAL_LABEL[t.sucursalDestino]}`,
    });
  }
  for (const l of liquidaciones) {
    const montoARS = montoEnARS(l.monto, l.moneda, l.tipoCambio);
    list.push({
      id: `LIQ-${l.id}`,
      tipo: "LIQUIDACION",
      fecha: l.fecha,
      productoId: null,
      productoNombre: "Pago a proveedor",
      sucursal: null,
      sucursalDestino: null,
      cantidadCajas: null,
      precioUnitario: null,
      total: montoARS,
      usuarioNombre: l.admin.nombre,
      motivo: null,
      notas: l.notas ?? l.comprobante ?? null,
    });
  }

  list.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  return list;
}

export const getMovimientos = unstable_cache(
  _getMovimientos,
  ["movimientos"],
  {
    tags: [
      "movimientos",
      "ingresos",
      "ventas",
      "bajas",
      "transferencias",
      "liquidaciones",
    ],
    revalidate: 60,
  },
);
