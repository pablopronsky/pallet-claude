import "server-only";

import { Sucursal } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type StockFila = {
  productoId: string;
  productoNombre: string;
  sucursal: Sucursal;
  ingresado: number;
  vendido: number;
  dadoDeBaja: number;
  stock: number;
};

// Calcula stock por producto + sucursal:
//   stock = ingresado - vendido - dadoDeBaja
// Pensado para tablas y dashboard. Si se pasa una sucursal, filtra.
export async function getStockActual(filtro?: {
  sucursal?: Sucursal;
  productoId?: string;
}): Promise<StockFila[]> {
  const wherePS = {
    ...(filtro?.sucursal ? { sucursal: filtro.sucursal } : {}),
    ...(filtro?.productoId ? { productoId: filtro.productoId } : {}),
  };

  const [ingresos, ventas, bajas, productos] = await Promise.all([
    prisma.ingreso.groupBy({
      by: ["productoId", "sucursal"],
      where: wherePS,
      _sum: { cantidadCajas: true },
    }),
    prisma.venta.groupBy({
      by: ["productoId", "sucursal"],
      where: wherePS,
      _sum: { cantidadCajas: true },
    }),
    prisma.baja.groupBy({
      by: ["productoId", "sucursal"],
      where: wherePS,
      _sum: { cantidadCajas: true },
    }),
    prisma.producto.findMany({ select: { id: true, nombre: true } }),
  ]);

  const productoNombre = new Map(productos.map((p) => [p.id, p.nombre]));

  const key = (pid: string, suc: Sucursal) => `${pid}__${suc}`;
  const mapa = new Map<string, StockFila>();

  for (const r of ingresos) {
    const k = key(r.productoId, r.sucursal);
    mapa.set(k, {
      productoId: r.productoId,
      productoNombre: productoNombre.get(r.productoId) ?? "(eliminado)",
      sucursal: r.sucursal,
      ingresado: r._sum.cantidadCajas ?? 0,
      vendido: 0,
      dadoDeBaja: 0,
      stock: 0,
    });
  }
  for (const r of ventas) {
    const k = key(r.productoId, r.sucursal);
    const existente =
      mapa.get(k) ??
      ({
        productoId: r.productoId,
        productoNombre: productoNombre.get(r.productoId) ?? "(eliminado)",
        sucursal: r.sucursal,
        ingresado: 0,
        vendido: 0,
        dadoDeBaja: 0,
        stock: 0,
      } satisfies StockFila);
    existente.vendido = r._sum.cantidadCajas ?? 0;
    mapa.set(k, existente);
  }
  for (const r of bajas) {
    const k = key(r.productoId, r.sucursal);
    const existente =
      mapa.get(k) ??
      ({
        productoId: r.productoId,
        productoNombre: productoNombre.get(r.productoId) ?? "(eliminado)",
        sucursal: r.sucursal,
        ingresado: 0,
        vendido: 0,
        dadoDeBaja: 0,
        stock: 0,
      } satisfies StockFila);
    existente.dadoDeBaja = r._sum.cantidadCajas ?? 0;
    mapa.set(k, existente);
  }

  const filas = Array.from(mapa.values()).map((f) => ({
    ...f,
    stock: f.ingresado - f.vendido - f.dadoDeBaja,
  }));

  filas.sort(
    (a, b) =>
      a.productoNombre.localeCompare(b.productoNombre) ||
      a.sucursal.localeCompare(b.sucursal),
  );

  return filas;
}

// Cajas disponibles por producto + sucursal para forms de venta (stock > 0).
export async function getDisponiblesParaVender(sucursal: Sucursal) {
  const filas = await getStockActual({ sucursal });
  return filas.filter((f) => f.stock > 0);
}

// Detalle FIFO de ingresos con stock remanente, para consumir al vender.
// stockIngreso = cantidadCajas - SUM(ventas.cantidadCajas) por ese ingreso.
export async function getIngresosDisponiblesFIFO(
  productoId: string,
  sucursal: Sucursal,
) {
  const ingresos = await prisma.ingreso.findMany({
    where: { productoId, sucursal },
    orderBy: { fecha: "asc" },
    include: {
      ventas: { select: { cantidadCajas: true } },
    },
  });

  return ingresos
    .map((i) => {
      const vendidas = i.ventas.reduce((acc, v) => acc + v.cantidadCajas, 0);
      const disponibles = i.cantidadCajas - vendidas;
      return {
        id: i.id,
        fecha: i.fecha,
        precioCostoPorCaja: i.precioCostoPorCaja,
        cantidadCajas: i.cantidadCajas,
        vendidas,
        disponibles,
      };
    })
    .filter((i) => i.disponibles > 0);
}
