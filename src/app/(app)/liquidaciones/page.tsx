import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Plus, Wallet } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/export-buttons";
import { getDashboardData } from "@/server/queries/dashboard";
import { getTotalLiquidadoARS } from "@/server/queries/liquidaciones";
import { PROVEEDOR_NOMBRE } from "@/lib/constants";
import {
  formatARS,
  formatFecha,
  formatMoneda,
  montoEnARS,
  toNumber,
} from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function LiquidacionesPage({ searchParams }: PageProps) {
  const session = await auth();
  const rol = session?.user.rol;
  if (rol !== "ADMIN" && rol !== "LOGISTICA") redirect("/dashboard");

  const { ok } = await searchParams;

  const [liquidaciones, dashboard, liquidadoTotalARS] = await Promise.all([
    prisma.liquidacion.findMany({
      orderBy: { fecha: "desc" },
      include: { admin: { select: { nombre: true } } },
    }),
    getDashboardData(),
    getTotalLiquidadoARS(),
  ]);

  const deudaBrutaARS = dashboard.deudaTotal;
  const saldoPendienteARS = Math.max(0, deudaBrutaARS - liquidadoTotalARS);

  const rowsExport = liquidaciones.map((l) => ({
    fecha: formatFecha(l.fecha),
    monto: toNumber(l.monto),
    moneda: l.moneda,
    tipoCambio: l.tipoCambio ? toNumber(l.tipoCambio) : "",
    montoARS: montoEnARS(l.monto, l.moneda, l.tipoCambio),
    comprobante: l.comprobante ?? "",
    registradoPor: l.admin.nombre,
    notas: l.notas ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            Cuenta corriente con {PROVEEDOR_NOMBRE}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Liquidaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Pagos al proveedor por mercadería ya vendida.
          </p>
        </div>
        {rol === "ADMIN" && (
          <Button asChild>
            <Link href="/liquidaciones/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva liquidación
            </Link>
          </Button>
        )}
      </div>

      {ok && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Liquidación registrada</AlertTitle>
          <AlertDescription>
            Se descontó del saldo pendiente con el proveedor.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <ResumenCard
          titulo={`Deuda generada`}
          valor={formatARS(deudaBrutaARS)}
          ayuda="Costo de toda la mercadería vendida (en ARS)"
        />
        <ResumenCard
          titulo="Total liquidado"
          valor={formatARS(liquidadoTotalARS)}
          ayuda="Suma de pagos en ARS equivalentes"
          acento="green"
        />
        <ResumenCard
          titulo="Saldo pendiente"
          valor={formatARS(saldoPendienteARS)}
          ayuda="Lo que aún se debe pagar al proveedor"
          acento="orange"
        />
      </div>

      <div className="np-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="font-medium">{liquidaciones.length}</span> pagos
          registrados
        </div>
        <ExportButtons
          filename="liquidaciones"
          sheetName="Liquidaciones"
          rows={rowsExport}
          columns={[
            { header: "Fecha", key: "fecha" },
            { header: "Monto", key: "monto" },
            { header: "Moneda", key: "moneda" },
            { header: "TC", key: "tipoCambio" },
            { header: "Monto ARS", key: "montoARS" },
            { header: "Comprobante", key: "comprobante" },
            { header: "Registrado por", key: "registradoPor" },
            { header: "Notas", key: "notas" },
          ]}
        />
      </div>

      <div className="np-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">TC</TableHead>
              <TableHead className="text-right">Equiv. ARS</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidaciones.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{formatFecha(l.fecha)}</TableCell>
                <TableCell className="text-right tabular">
                  {formatMoneda(l.monto, l.moneda)}
                </TableCell>
                <TableCell>{l.moneda}</TableCell>
                <TableCell className="text-right tabular">
                  {l.tipoCambio ? toNumber(l.tipoCambio).toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-right tabular font-medium">
                  {formatARS(montoEnARS(l.monto, l.moneda, l.tipoCambio))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {l.comprobante ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {l.admin.nombre}
                </TableCell>
              </TableRow>
            ))}
            {liquidaciones.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Todavía no hay liquidaciones registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {liquidaciones.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Total liquidado en ARS
                </TableCell>
                <TableCell
                  colSpan={3}
                  className="text-right text-base font-semibold"
                >
                  {formatARS(liquidadoTotalARS)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}

function ResumenCard({
  titulo,
  valor,
  ayuda,
  acento,
}: {
  titulo: string;
  valor: string;
  ayuda: string;
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
        <span
          className="grid h-7 w-7 place-items-center rounded-md"
          style={{
            background: "color-mix(in oklab, " + acentoColor + " 18%, transparent)",
            color: acentoColor,
          }}
        >
          <Wallet className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>
    </div>
  );
}
