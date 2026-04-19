import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SucursalChip } from "@/components/sucursal-chip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/export-buttons";
import { SUCURSAL_LABEL } from "@/lib/constants";
import {
  formatARS,
  formatCajas,
  formatFecha,
  montoEnARS,
  toNumber,
} from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function VentasPage({ searchParams }: PageProps) {
  const session = await auth();
  const user = session!.user;
  const { ok } = await searchParams;

  const where = user.rol === "VENDEDOR" ? { sucursal: user.sucursal! } : {};

  const ventas = await prisma.venta.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: {
      producto: { select: { nombre: true } },
      ingreso: { select: { precioCostoPorCaja: true, moneda: true, tipoCambio: true } },
      user: { select: { nombre: true } },
    },
  });

  const totalCajas = ventas.reduce((a, v) => a + v.cantidadCajas, 0);
  const totalVendido = ventas.reduce(
    (a, v) => a + montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio) * v.cantidadCajas,
    0,
  );
  const utilidadTotal = ventas.reduce(
    (a, v) =>
      a +
      (montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio) -
        montoEnARS(v.ingreso.precioCostoPorCaja, v.ingreso.moneda, v.ingreso.tipoCambio)) *
        v.cantidadCajas,
    0,
  );

  const rowsExport = ventas.map((v) => ({
    fecha: formatFecha(v.fecha),
    producto: v.producto.nombre,
    sucursal: SUCURSAL_LABEL[v.sucursal],
    cajas: v.cantidadCajas,
    precioVenta: montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio),
    precioCosto: montoEnARS(v.ingreso.precioCostoPorCaja, v.ingreso.moneda, v.ingreso.tipoCambio),
    totalVenta: montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio) * v.cantidadCajas,
    utilidad:
      (montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio) -
        montoEnARS(v.ingreso.precioCostoPorCaja, v.ingreso.moneda, v.ingreso.tipoCambio)) *
      v.cantidadCajas,
    vendedor: v.user.nombre,
    notas: v.notas ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            Operación
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Ventas
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.rol === "VENDEDOR"
              ? `Ventas de ${SUCURSAL_LABEL[user.sucursal!]}.`
              : "Ventas registradas en todas las sucursales."}
          </p>
        </div>
        <Button asChild>
          <Link href="/ventas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva venta
          </Link>
        </Button>
      </div>

      {ok && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Venta registrada</AlertTitle>
          <AlertDescription>
            El stock se descontó automáticamente según el orden de ingreso (FIFO).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="np-card p-4">
          <p className="np-kicker">Cajas vendidas</p>
          <p className="mt-2 text-2xl font-semibold tabular">{formatCajas(totalCajas)}</p>
        </div>
        <div className="np-card p-4">
          <p className="np-kicker">Total facturado</p>
          <p className="mt-2 text-2xl font-semibold tabular">{formatARS(totalVendido)}</p>
        </div>
        <div className="np-card p-4">
          <p className="np-kicker">Utilidad bruta</p>
          <p className="text-2xl font-semibold tabular" style={{ color: "var(--np-orange)" }}>
            {formatARS(utilidadTotal)}
          </p>
        </div>
      </div>

      <div className="np-card flex flex-wrap items-center justify-end gap-3 p-4">
        <ExportButtons
          filename="ventas"
          sheetName="Ventas"
          rows={rowsExport}
          columns={[
            { header: "Fecha", key: "fecha" },
            { header: "Modelo", key: "producto" },
            { header: "Sucursal", key: "sucursal" },
            { header: "Cajas", key: "cajas" },
            { header: "Precio venta", key: "precioVenta" },
            { header: "Costo/caja", key: "precioCosto" },
            { header: "Total venta", key: "totalVenta" },
            { header: "Utilidad", key: "utilidad" },
            { header: "Vendedor", key: "vendedor" },
            { header: "Notas", key: "notas" },
          ]}
        />
      </div>

      <div className="np-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="text-right">Cajas</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Utilidad</TableHead>
              <TableHead>Vendedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((v) => {
              const precio = montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio);
              const costo = montoEnARS(v.ingreso.precioCostoPorCaja, v.ingreso.moneda, v.ingreso.tipoCambio);
              const total = precio * v.cantidadCajas;
              const utilidad = (precio - costo) * v.cantidadCajas;
              return (
                <TableRow key={v.id}>
                  <TableCell>{formatFecha(v.fecha)}</TableCell>
                  <TableCell className="font-medium">
                    {v.producto.nombre}
                  </TableCell>
                  <TableCell>
                    <SucursalChip sucursal={v.sucursal} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCajas(v.cantidadCajas)}
                  </TableCell>
                  <TableCell className="text-right">{formatARS(precio)}</TableCell>
                  <TableCell className="text-right">{formatARS(total)}</TableCell>
                  <TableCell className="text-right tabular" style={{ color: "var(--np-orange)" }}>
                    {formatARS(utilidad)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.user.nombre}
                  </TableCell>
                </TableRow>
              );
            })}
            {ventas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  Todavía no hay ventas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
