import "server-only";

import { unstable_cache } from "next/cache";
import { Sucursal } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStockActual, type StockFila } from "@/server/queries/stock";
import { montoEnARS } from "@/lib/format";
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

export type AlertaStock = {
  productoId: string;
  productoNombre: string;
  sucursal: Sucursal;
  stock: number;
  stockMinimo: number;
};

export type DashboardData = {
  deudaTotal: number; // ARS equivalente, bruto (sin restar liquidaciones)
  liquidadoTotal: number; // ARS equivalente
  saldoPendiente: number; // deudaTotal - liquidadoTotal (>= 0)
  utilidadTotal: number;
  totalVendido: number;
  cajasVendidas: number;
  cajasIngresadas: number; // solo origen PROVEEDOR
  cajasDadasDeBaja: number;
  stockCajas: number;
  stock: StockFila[];
  alertasStockBajo: AlertaStock[];
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
    origen: "PROVEEDOR" as const,
  };
  // Liquidaciones son globales (no se filtran por sucursal). Solo respetan rango de fechas.
  const [ventas, ingresosAgg, bajasAgg, productos, liquidaciones] =
    await Promise.all([
      prisma.venta.findMany({
        where: whereVentas,
        include: {
          ingreso: {
            select: {
              precioCostoPorCaja: true,
              moneda: true,
              tipoCambio: true,
            },
          },
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
      sucursal
        ? Promise.resolve(
            [] as Array<{
              monto: import("@prisma/client").Prisma.Decimal;
              moneda: import("@prisma/client").Moneda;
              tipoCambio: import("@prisma/client").Prisma.Decimal | null;
            }>,
          )
        : prisma.liquidacion.findMany({
            where: rango,
            select: { monto: true, moneda: true, tipoCambio: true },
          }),
    ]);

  const productoNombre = new Map(productos.map((p) => [p.id, p.nombre]));

  let deudaTotal = 0;
  let utilidadTotal = 0;
  let totalVendido = 0;
  let cajasVendidas = 0;

  const porSucursal = new Map<Sucursal, VentasPorSucursal>();
  const porModelo = new Map<string, TopModelo>();
  const porMes = new Map<string, PuntoEvolucion>();

  for (const v of ventas) {
    const costoARS = montoEnARS(
      v.ingreso.precioCostoPorCaja,
      v.ingreso.moneda,
      v.ingreso.tipoCambio,
    );
    const precioARS = montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio);
    const cajas = v.cantidadCajas;

    const totalVenta = precioARS * cajas;
    const costoVenta = costoARS * cajas;
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

  const liquidadoTotal = liquidaciones.reduce(
    (acc, l) => acc + montoEnARS(l.monto, l.moneda, l.tipoCambio),
    0,
  );
  const saldoPendiente = Math.max(0, deudaTotal - liquidadoTotal);

  const stock = await getStockActual(
    sucursal ? { sucursal } : undefined,
  );
  const stockCajas = stock.reduce((acc, f) => acc + f.stock, 0);

  // Alertas: filas con stockMinimo > 0 cuyo stock actual cae por debajo del umbral.
  const alertasStockBajo: AlertaStock[] = stock
    .filter((f) => f.stockMinimo > 0 && f.stock <= f.stockMinimo)
    .map((f) => ({
      productoId: f.productoId,
      productoNombre: f.productoNombre,
      sucursal: f.sucursal,
      stock: f.stock,
      stockMinimo: f.stockMinimo,
    }))
    .sort((a, b) => a.stock - b.stock);

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
    liquidadoTotal,
    saldoPendiente,
    utilidadTotal,
    totalVendido,
    cajasVendidas,
    cajasIngresadas: ingresosAgg._sum.cantidadCajas ?? 0,
    cajasDadasDeBaja: bajasAgg._sum.cantidadCajas ?? 0,
    stockCajas,
    stock,
    alertasStockBajo,
    ventasPorSucursal,
    topModelos,
    evolucion,
  };
}

export const getDashboardData = unstable_cache(
  _getDashboardData,
  ["dashboard-data"],
  {
    tags: [
      "dashboard",
      "ingresos",
      "ventas",
      "bajas",
      "transferencias",
      "liquidaciones",
    ],
    revalidate: 60,
  },
);
