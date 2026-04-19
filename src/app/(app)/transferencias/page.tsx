import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";

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
import { formatCajas, formatFecha } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function TransferenciasPage({ searchParams }: PageProps) {
  const session = await auth();
  const rol = session?.user.rol;
  if (rol !== "ADMIN" && rol !== "LOGISTICA") redirect("/dashboard");

  const { ok } = await searchParams;

  const transferencias = await prisma.transferencia.findMany({
    orderBy: { fecha: "desc" },
    include: {
      producto: { select: { nombre: true } },
      admin: { select: { nombre: true } },
    },
  });

  const totalCajas = transferencias.reduce((a, t) => a + t.cantidadCajas, 0);

  const rowsExport = transferencias.map((t) => ({
    fecha: formatFecha(t.fecha),
    producto: t.producto.nombre,
    origen: SUCURSAL_LABEL[t.sucursalOrigen],
    destino: SUCURSAL_LABEL[t.sucursalDestino],
    cajas: t.cantidadCajas,
    registradoPor: t.admin.nombre,
    notas: t.notas ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            Logística
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Transferencias
          </h1>
          <p className="text-sm text-muted-foreground">
            Movimiento de cajas entre sucursales. El costo del lote se preserva
            en el destino.
          </p>
        </div>
        {rol === "ADMIN" && (
          <Button asChild>
            <Link href="/transferencias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva transferencia
            </Link>
          </Button>
        )}
      </div>

      {ok && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Transferencia registrada</AlertTitle>
          <AlertDescription>
            El stock se actualizó en ambas sucursales.
          </AlertDescription>
        </Alert>
      )}

      <div className="np-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="font-medium">{transferencias.length}</span>{" "}
          transferencias ·{" "}
          <span className="font-medium">{formatCajas(totalCajas)}</span> cajas
          movidas
        </div>
        <ExportButtons
          filename="transferencias"
          sheetName="Transferencias"
          rows={rowsExport}
          columns={[
            { header: "Fecha", key: "fecha" },
            { header: "Modelo", key: "producto" },
            { header: "Origen", key: "origen" },
            { header: "Destino", key: "destino" },
            { header: "Cajas", key: "cajas" },
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
              <TableHead>Origen</TableHead>
              <TableHead></TableHead>
              <TableHead>Destino</TableHead>
              <TableHead className="text-right">Cajas</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transferencias.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{formatFecha(t.fecha)}</TableCell>
                <TableCell className="font-medium">
                  {t.producto.nombre}
                </TableCell>
                <TableCell>
                  <SucursalChip sucursal={t.sucursalOrigen} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <SucursalChip sucursal={t.sucursalDestino} />
                </TableCell>
                <TableCell className="text-right tabular">
                  {formatCajas(t.cantidadCajas)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.admin.nombre}
                </TableCell>
              </TableRow>
            ))}
            {transferencias.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Todavía no hay transferencias registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
