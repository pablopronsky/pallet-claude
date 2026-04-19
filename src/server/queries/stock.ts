import "server-only";

import { unstable_cache } from "next/cache";
import { Sucursal } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type StockFila = {
  productoId: string;
  productoNombre: string;
  sucursal: Sucursal;
  ingresado: number;
  transferidaEntrada: number;
  vendido: number;
  dadoDeBaja: number;
  transferidoSalida: number;
  stock: number;
  stockMinimo: number;
};

// Calcula stock por producto + sucursal:
//   stock = ingresado (solo PROVEEDOR) + transferidaEntrada - vendido - dadoDeBaja - transferidoSalida
// Pensado para tablas y dashboard. Si se pasa una sucursal, filtra.
async function _getStockActual(filtro?: {
  sucursal?: Sucursal;
  productoId?: string;
}): Promise<StockFila[]> {
  const wherePS = {
    ...(filtro?.sucursal ? { sucursal: filtro.sucursal } : {}),
    ...(filtro?.productoId ? { productoId: filtro.productoId } : {}),
  };

  const whereTransferOrigen = {
    ...(filtro?.sucursal ? { sucursalOrigen: filtro.sucursal } : {}),
    ...(filtro?.productoId ? { productoId: filtro.productoId } : {}),
  };

  const [ingresosPorOrigen, ventas, bajas, transferencias, productos] = await Promise.all([
    prisma.ingreso.groupBy({
      by: ["productoId", "sucursal", "origen"],
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
    prisma.transferencia.groupBy({
      by: ["productoId", "sucursalOrigen"],
      where: whereTransferOrigen,
      _sum: { cantidadCajas: true },
    }),
    prisma.producto.findMany({
      select: { id: true, nombre: true, stockMinimo: true },
    }),
  ]);

  const productoNombre = new Map(productos.map((p) => [p.id, p.nombre]));
  const productoStockMin = new Map(
    productos.map((p) => [p.id, p.stockMinimo]),
  );

  const key = (pid: string, suc: Sucursal) => `${pid}__${suc}`;
  const mapa = new Map<string, StockFila>();

  const garantizar = (pid: string, suc: Sucursal): StockFila => {
    const k = key(pid, suc);
    const existente = mapa.get(k);
    if (existente) return existente;
    const fila: StockFila = {
      productoId: pid,
      productoNombre: productoNombre.get(pid) ?? "(eliminado)",
      sucursal: suc,
      ingresado: 0,
      transferidaEntrada: 0,
      vendido: 0,
      dadoDeBaja: 0,
      transferidoSalida: 0,
      stock: 0,
      stockMinimo: productoStockMin.get(pid) ?? 0,
    };
    mapa.set(k, fila);
    return fila;
  };

  for (const r of ingresosPorOrigen) {
    const fila = garantizar(r.productoId, r.sucursal);
    const cajas = r._sum.cantidadCajas ?? 0;
    if (r.origen === "PROVEEDOR") fila.ingresado += cajas;
    else fila.transferidaEntrada += cajas;
  }
  for (const r of ventas) {
    garantizar(r.productoId, r.sucursal).vendido = r._sum.cantidadCajas ?? 0;
  }
  for (const r of bajas) {
    garantizar(r.productoId, r.sucursal).dadoDeBaja = r._sum.cantidadCajas ?? 0;
  }
  for (const r of transferencias) {
    garantizar(r.productoId, r.sucursalOrigen).transferidoSalida =
      r._sum.cantidadCajas ?? 0;
  }

  const filas = Array.from(mapa.values()).map((f) => ({
    ...f,
    stock: f.ingresado + f.transferidaEntrada - f.vendido - f.dadoDeBaja - f.transferidoSalida,
  }));

  filas.sort(
    (a, b) =>
      a.productoNombre.localeCompare(b.productoNombre) ||
      a.sucursal.localeCompare(b.sucursal),
  );

  return filas;
}

export const getStockActual = unstable_cache(
  _getStockActual,
  ["stock-actual"],
  {
    tags: ["stock", "ingresos", "ventas", "bajas", "transferencias"],
    revalidate: 60,
  },
);

// Cajas disponibles por producto + sucursal para forms de venta (stock > 0).
export async function getDisponiblesParaVender(sucursal: Sucursal) {
  const filas = await getStockActual({ sucursal });
  return filas.filter((f) => f.stock > 0);
}

// Detalle FIFO de ingresos con stock remanente, para consumir al vender.
// stockIngreso = cantidadCajas - SUM(ventas) - SUM(transferencias salientes).
export async function getIngresosDisponiblesFIFO(
  productoId: string,
  sucursal: Sucursal,
) {
  const ingresos = await prisma.ingreso.findMany({
    where: { productoId, sucursal },
    orderBy: { fecha: "asc" },
    include: {
      ventas: { select: { cantidadCajas: true } },
      transferenciasOrigen: { select: { cantidadCajas: true } },
    },
  });

  return ingresos
    .map((i) => {
      const vendidas = i.ventas.reduce((acc, v) => acc + v.cantidadCajas, 0);
      const transferidas = i.transferenciasOrigen.reduce(
        (acc, t) => acc + t.cantidadCajas,
        0,
      );
      const disponibles = i.cantidadCajas - vendidas - transferidas;
      return {
        id: i.id,
        fecha: i.fecha,
        precioCostoPorCaja: i.precioCostoPorCaja,
        cantidadCajas: i.cantidadCajas,
        vendidas,
        transferidas,
        disponibles,
      };
    })
    .filter((i) => i.disponibles > 0);
}
