import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  MinusCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filtrosSchema } from "@/schemas/filtros";
import { getDashboardData } from "@/server/queries/dashboard";
import { PROVEEDOR_NOMBRE, SUCURSAL_LABEL } from "@/lib/constants";
import { FiltrosForm } from "@/components/filtros-form";
import { PDFDownloadButton } from "@/components/dashboard/pdf-download-button";
import {
  ChartEvolucion,
  ChartTopModelos,
  ChartUtilidadPorSucursal,
  ChartVentasPorSucursal,
  SparklineDeuda,
} from "@/components/dashboard/charts";
import { SucursalChip } from "@/components/sucursal-chip";
import { formatARS, formatCajas } from "@/lib/format";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  const user = session!.user;

  const sp = await searchParams;
  const filtros = filtrosSchema.parse(sp);

  const [productos, data] = await Promise.all([
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    getDashboardData({
      ...filtros,
      sucursalForzada: user.rol === "VENDEDOR" ? user.sucursal! : undefined,
    }),
  ]);

  const tituloAlcance =
    user.rol === "VENDEDOR"
      ? `Sucursal ${SUCURSAL_LABEL[user.sucursal!]}`
      : filtros.sucursal
        ? `Sucursal ${SUCURSAL_LABEL[filtros.sucursal]}`
        : "Todas las sucursales";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            Consignación · {PROVEEDOR_NOMBRE}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Resumen operativo
          </h1>
          <p className="text-sm text-muted-foreground">{tituloAlcance}</p>
        </div>
        <PDFDownloadButton
          data={data}
          filtros={{
            desde: sp.desde,
            hasta: sp.hasta,
            sucursal: user.rol === "VENDEDOR" ? user.sucursal ?? undefined : sp.sucursal,
          }}
          generadoPor={user.name ?? user.email ?? "Usuario"}
        />
      </div>

      <FiltrosForm
        action="/dashboard"
        permitirSucursal={user.rol !== "VENDEDOR"}
        productos={productos}
        defaultValues={{
          desde: sp.desde ?? "",
          hasta: sp.hasta ?? "",
          sucursal: (sp.sucursal as typeof filtros.sucursal) ?? "",
          productoId: sp.productoId ?? "",
        }}
      />

      {/* KPI row: hero (x2) + saldo + utilidad + stock */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HeroKpi
          titulo={
            user.rol !== "VENDEDOR"
              ? `Saldo pendiente con ${PROVEEDOR_NOMBRE}`
              : `Deuda con ${PROVEEDOR_NOMBRE}`
          }
          valor={formatARS(
            user.rol !== "VENDEDOR" ? data.saldoPendiente : data.deudaTotal,
          )}
          ayuda={
            user.rol !== "VENDEDOR"
              ? `Deuda generada ${formatARS(data.deudaTotal)} − liquidado ${formatARS(data.liquidadoTotal)}`
              : "Total a pagar por mercadería ya vendida."
          }
          sparkline={<SparklineDeuda data={data.evolucion} />}
        />
        <KpiCard
          titulo="Utilidad bruta"
          valor={formatARS(data.utilidadTotal)}
          ayuda="Venta − costo"
          icon={<TrendingUp className="h-4 w-4" />}
          acento="orange"
        />
        <KpiCard
          titulo="Stock actual"
          valor={`${formatCajas(data.stockCajas)}`}
          sufijo="cajas"
          ayuda="Disponibles ahora"
          icon={<Package className="h-4 w-4" />}
          acento="green"
        />
        <KpiCard
          titulo="Cajas vendidas"
          valor={`${formatCajas(data.cajasVendidas)}`}
          sufijo="cajas"
          ayuda="Total del período"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
      </div>

      {data.alertasStockBajo.length > 0 && (
        <div
          className="np-card p-5"
          style={{
            borderColor:
              "color-mix(in oklab, var(--np-orange) 50%, var(--np-line))",
            background:
              "color-mix(in oklab, var(--np-orange) 8%, transparent)",
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="h-5 w-5"
                style={{ color: "var(--np-orange)" }}
              />
              <div>
                <h3 className="text-sm font-semibold">Stock bajo</h3>
                <p className="text-xs text-muted-foreground">
                  {data.alertasStockBajo.length} combinaciones por debajo del
                  umbral mínimo.
                </p>
              </div>
            </div>
            <Link
              href="/productos"
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Configurar umbrales
            </Link>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {data.alertasStockBajo.slice(0, 9).map((a) => (
              <div
                key={`${a.productoId}-${a.sucursal}`}
                className="flex items-center justify-between rounded-md border bg-background/40 px-3 py-2 text-sm"
                style={{ borderColor: "var(--np-line)" }}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.productoNombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {SUCURSAL_LABEL[a.sucursal]}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-base font-semibold tabular"
                    style={{ color: "var(--np-orange)" }}
                  >
                    {formatCajas(a.stock)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    mín. {a.stockMinimo}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {data.alertasStockBajo.length > 9 && (
            <p className="mt-3 text-xs text-muted-foreground">
              + {data.alertasStockBajo.length - 9} más. Revisá la página de{" "}
              <Link href="/stock" className="underline">
                Stock
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {/* KPI row secundaria */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          titulo="Total facturado"
          valor={formatARS(data.totalVendido)}
          ayuda={`${formatCajas(data.cajasVendidas)} cajas vendidas`}
          icon={<Receipt className="h-4 w-4" />}
        />
        <KpiCard
          titulo="Ingresos del período"
          valor={`${formatCajas(data.cajasIngresadas)}`}
          sufijo="cajas"
          ayuda="Mercadería recibida"
          icon={<ArrowDownToLine className="h-4 w-4" />}
        />
        <KpiCard
          titulo="Bajas"
          valor={`${formatCajas(data.cajasDadasDeBaja)}`}
          sufijo="cajas"
          ayuda="No generan deuda"
          icon={<MinusCircle className="h-4 w-4" />}
        />
      </div>

      {/* Grid de charts 2x2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          titulo="Evolución mensual"
          descripcion="Ventas y utilidad bruta."
        >
          <ChartEvolucion data={data.evolucion} />
        </ChartCard>

        <ChartCard
          titulo="Ventas por sucursal"
          descripcion="Total facturado."
        >
          <ChartVentasPorSucursal data={data.ventasPorSucursal} />
        </ChartCard>

        <ChartCard titulo="Top 5 modelos" descripcion="Por cajas vendidas.">
          <ChartTopModelos data={data.topModelos} />
        </ChartCard>

        <ChartCard
          titulo="Utilidad por sucursal"
          descripcion="Ganancia bruta del período."
        >
          <ChartUtilidadPorSucursal data={data.ventasPorSucursal} />
        </ChartCard>
      </div>

      {/* Stock detalle */}
      <div className="np-card overflow-hidden">
        <div className="border-b p-5" style={{ borderColor: "var(--np-line)" }}>
          <p className="np-kicker mb-1">Stock por sucursal y modelo</p>
          <h2 className="text-base font-semibold">
            Disponibilidad actual
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px] uppercase tracking-wider text-muted-foreground"
                style={{ background: "var(--np-panel-2)" }}
              >
                <th className="px-5 py-3">Sucursal</th>
                <th className="px-5 py-3">Modelo</th>
                <th className="px-5 py-3 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.stock.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-muted-foreground">
                    Sin movimientos.
                  </td>
                </tr>
              )}
              {data.stock.map((f) => (
                <tr
                  key={`${f.productoId}-${f.sucursal}`}
                  className="border-t"
                  style={{ borderColor: "var(--np-line)" }}
                >
                  <td className="px-5 py-2.5">
                    <SucursalChip sucursal={f.sucursal} />
                  </td>
                  <td className="px-5 py-2.5 font-medium">{f.productoNombre}</td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular">
                    {formatCajas(f.stock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeroKpi({
  titulo,
  valor,
  ayuda,
  sparkline,
}: {
  titulo: string;
  valor: string;
  ayuda: string;
  sparkline: React.ReactNode;
}) {
  return (
    <div
      className="np-card relative overflow-hidden p-6 md:col-span-2"
      style={{
        background:
          "linear-gradient(135deg, rgba(0,103,48,0.22) 0%, rgba(16,18,21,1) 55%)",
        borderColor: "color-mix(in oklab, var(--np-green) 40%, var(--np-line))",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            {titulo}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular md:text-4xl">
            {valor}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>
        </div>
        <div
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg sm:grid"
          style={{
            background: "color-mix(in oklab, var(--np-orange) 20%, transparent)",
            color: "var(--np-orange)",
          }}
        >
          <Wallet className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 -mx-1">{sparkline}</div>
    </div>
  );
}

function KpiCard({
  titulo,
  valor,
  sufijo,
  ayuda,
  icon,
  acento,
}: {
  titulo: string;
  valor: string;
  sufijo?: string;
  ayuda?: string;
  icon?: React.ReactNode;
  acento?: "green" | "orange";
}) {
  const acentoColor =
    acento === "green"
      ? "var(--np-green)"
      : acento === "orange"
        ? "var(--np-orange)"
        : "var(--np-text-dim)";
  return (
    <div className="np-card p-5">
      <div className="flex items-center justify-between">
        <p className="np-kicker">{titulo}</p>
        {icon && (
          <span
            className="grid h-7 w-7 place-items-center rounded-md"
            style={{
              background: "color-mix(in oklab, " + acentoColor + " 18%, transparent)",
              color: acentoColor,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular">
        {valor}
        {sufijo && (
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            {sufijo}
          </span>
        )}
      </p>
      {ayuda && <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

function ChartCard({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="np-card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
      {children}
    </div>
  );
}
