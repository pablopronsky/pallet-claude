import Link from "next/link";
import { redirect } from "next/navigation";
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
  toNumber,
} from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function IngresosPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user.rol !== "ADMIN") redirect("/dashboard");

  const { ok } = await searchParams;

  const ingresos = await prisma.ingreso.findMany({
    orderBy: { fecha: "desc" },
    include: {
      producto: { select: { nombre: true } },
      admin: { select: { nombre: true } },
    },
  });

  const totalCajas = ingresos.reduce((a, i) => a + i.cantidadCajas, 0);
  const totalCostoProyectado = ingresos.reduce(
    (a, i) => a + toNumber(i.precioCostoPorCaja) * i.cantidadCajas,
    0,
  );

  const rowsExport = ingresos.map((i) => ({
    fecha: formatFecha(i.fecha),
    producto: i.producto.nombre,
    sucursal: SUCURSAL_LABEL[i.sucursal],
    cajas: i.cantidadCajas,
    precioCosto: toNumber(i.precioCostoPorCaja),
    subtotal: toNumber(i.precioCostoPorCaja) * i.cantidadCajas,
    registradoPor: i.admin.nombre,
    notas: i.notas ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            Operación
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Ingresos
          </h1>
          <p className="text-sm text-muted-foreground">
            Mercadería recibida en consignación desde All Covering SRL.
          </p>
        </div>
        <Button asChild>
          <Link href="/ingresos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo ingreso
          </Link>
        </Button>
      </div>

      {ok && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Ingreso registrado</AlertTitle>
          <AlertDescription>
            La mercadería quedó incorporada al stock.
          </AlertDescription>
        </Alert>
      )}

      <div className="np-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="font-medium">{ingresos.length}</span> ingresos ·{" "}
          <span className="font-medium">{formatCajas(totalCajas)}</span> cajas
          recibidas · costo proyectado{" "}
          <span className="font-medium">
            {formatARS(totalCostoProyectado)}
          </span>
        </div>
        <ExportButtons
          filename="ingresos"
          sheetName="Ingresos"
          rows={rowsExport}
          columns={[
            { header: "Fecha", key: "fecha" },
            { header: "Modelo", key: "producto" },
            { header: "Sucursal", key: "sucursal" },
            { header: "Cajas", key: "cajas" },
            { header: "Costo/caja", key: "precioCosto" },
            { header: "Subtotal", key: "subtotal" },
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
              <TableHead>Modelo</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="text-right">Cajas</TableHead>
              <TableHead className="text-right">Costo/caja</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead>Cargado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingresos.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{formatFecha(i.fecha)}</TableCell>
                <TableCell className="font-medium">
                  {i.producto.nombre}
                </TableCell>
                <TableCell>
                  <SucursalChip sucursal={i.sucursal} />
                </TableCell>
                <TableCell className="text-right">
                  {formatCajas(i.cantidadCajas)}
                </TableCell>
                <TableCell className="text-right">
                  {formatARS(i.precioCostoPorCaja)}
                </TableCell>
                <TableCell className="text-right">
                  {formatARS(
                    toNumber(i.precioCostoPorCaja) * i.cantidadCajas,
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {i.admin.nombre}
                </TableCell>
              </TableRow>
            ))}
            {ingresos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Todavía no hay ingresos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
