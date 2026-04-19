import "server-only";

import { unstable_cache } from "next/cache";
import { Sucursal } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStockActual, type StockFila } from "@/server/queries/stock";
import type { Filtros } from "@/schemas/filtros";

type DashboardOpts = Filtros & {
  sucursalForzada?: Sucursal;
};

export type VentasPorSucursal = {
  sucursal: Sucursal;
  cajas: number;
  total: number;
  utilidad: number;
};

export type TopModelo = {
  productoId: string;
  productoNombre: string;
  cajas: number;
  total: number;
};

export type PuntoEvolucion = {
  mes: string; // YYYY-MM
  ventas: number;
  utilidad: number;
};

export type DashboardData = {
  deudaTotal: number;
  utilidadTotal: number;
  totalVendido: number;
  cajasVendidas: number;
  cajasIngresadas: number;
  cajasDadasDeBaja: number;
  stockCajas: number;
  stock: StockFila[];
  ventasPorSucursal: VentasPorSucursal[];
  topModelos: TopModelo[];
  evolucion: PuntoEvolucion[];
};

async function _getDashboardData(
  opts: DashboardOpts = {},
): Promise<DashboardData> {
  const sucursal = opts.sucursalForzada ?? opts.sucursal;

  const rango =
    opts.desde || opts.hasta
      ? {
          fecha: {
            ...(opts.desde ? { gte: opts.desde } : {}),
            ...(opts.hasta ? { lte: opts.hasta } : {}),
          },
        }
      : {};

  const whereVentas = {
    ...(sucursal ? { sucursal } : {}),
    ...rango,
  };
  const whereBajas = {
    ...(sucursal ? { sucursal } : {}),
    ...rango,
  };
  const whereIngresos = {
    ...(sucursal ? { sucursal } : {}),
    ...rango,
  };

  const [ventas, ingresosAgg, bajasAgg, productos] = await Promise.all([
    prisma.venta.findMany({
      where: whereVentas,
      include: {
        ingreso: { select: { precioCostoPorCaja: true } },
        producto: { select: { id: true, nombre: true } },
      },
    }),
    prisma.ingreso.aggregate({
      where: whereIngresos,
      _sum: { cantidadCajas: true },
    }),
    prisma.baja.aggregate({
      where: whereBajas,
      _sum: { cantidadCajas: true },
    }),
    prisma.producto.findMany({ select: { id: true, nombre: true } }),
  ]);

  // Mapa de nombres por producto (para top-modelos).
  const productoNombre = new Map(productos.map((p) => [p.id, p.nombre]));

  // Deuda total con All Covering = SUM(venta.cajas × costo_del_ingreso).
  // Utilidad bruta = SUM(venta.cajas × (precioVenta − precioCosto)).
  // Total vendido = SUM(venta.cajas × precioVenta).
  let deudaTotal = 0;
  let utilidadTotal = 0;
  let totalVendido = 0;
  let cajasVendidas = 0;

  const porSucursal = new Map<Sucursal, VentasPorSucursal>();
  const porModelo = new Map<string, TopModelo>();
  const porMes = new Map<string, PuntoEvolucion>();

  for (const v of ventas) {
    const costo = Number(v.ingreso.precioCostoPorCaja);
    const precio = Number(v.precioVentaPorCaja);
    const cajas = v.cantidadCajas;

    const totalVenta = precio * cajas;
    const costoVenta = costo * cajas;
    const utilidad = totalVenta - costoVenta;

    deudaTotal += costoVenta;
    utilidadTotal += utilidad;
    totalVendido += totalVenta;
    cajasVendidas += cajas;

    const ps = porSucursal.get(v.sucursal) ?? {
      sucursal: v.sucursal,
      cajas: 0,
      total: 0,
      utilidad: 0,
    };
    ps.cajas += cajas;
    ps.total += totalVenta;
    ps.utilidad += utilidad;
    porSucursal.set(v.sucursal, ps);

    const pm = porModelo.get(v.productoId) ?? {
      productoId: v.productoId,
      productoNombre: productoNombre.get(v.productoId) ?? v.producto.nombre,
      cajas: 0,
      total: 0,
    };
    pm.cajas += cajas;
    pm.total += totalVenta;
    porModelo.set(v.productoId, pm);

    const d = v.fecha;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const pm2 = porMes.get(key) ?? { mes: key, ventas: 0, utilidad: 0 };
    pm2.ventas += totalVenta;
    pm2.utilidad += utilidad;
    porMes.set(key, pm2);
  }

  const stock = await getStockActual(
    sucursal ? { sucursal } : undefined,
  );
  const stockCajas = stock.reduce((acc, f) => acc + f.stock, 0);

  const topModelos = Array.from(porModelo.values())
    .sort((a, b) => b.cajas - a.cajas)
    .slice(0, 5);

  const ventasPorSucursal = Array.from(porSucursal.values()).sort(
    (a, b) => b.total - a.total,
  );

  const evolucion = Array.from(porMes.values()).sort((a, b) =>
    a.mes.localeCompare(b.mes),
  );

  return {
    deudaTotal,
    utilidadTotal,
    totalVendido,
    cajasVendidas,
    cajasIngresadas: ingresosAgg._sum.cantidadCajas ?? 0,
    cajasDadasDeBaja: bajasAgg._sum.cantidadCajas ?? 0,
    stockCajas,
    stock,
    ventasPorSucursal,
    topModelos,
    evolucion,
  };
}

export const getDashboardData = unstable_cache(
  _getDashboardData,
  ["dashboard-data"],
  { tags: ["dashboard", "ingresos", "ventas", "bajas"], revalidate: 60 },
);
