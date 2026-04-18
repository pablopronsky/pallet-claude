import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MOTIVO_LABEL, SUCURSAL_LABEL } from "@/lib/constants";
import { formatCajas, formatFecha } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function BajasPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user.rol !== "ADMIN") redirect("/dashboard");

  const { ok } = await searchParams;

  const bajas = await prisma.baja.findMany({
    orderBy: { fecha: "desc" },
    include: {
      producto: { select: { nombre: true } },
      admin: { select: { nombre: true } },
    },
  });

  const totalCajas = bajas.reduce((a, b) => a + b.cantidadCajas, 0);

  const rowsExport = bajas.map((b) => ({
    fecha: formatFecha(b.fecha),
    producto: b.producto.nombre,
    sucursal: SUCURSAL_LABEL[b.sucursal],
    cajas: b.cantidadCajas,
    motivo: MOTIVO_LABEL[b.motivo],
    registradoPor: b.admin.nombre,
    notas: b.notas ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
            Operación
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Bajas
          </h1>
          <p className="text-sm text-muted-foreground">
            Muestras, roturas, donaciones. Reducen stock, no generan deuda.
          </p>
        </div>
        <Button asChild>
          <Link href="/bajas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva baja
          </Link>
        </Button>
      </div>

      {ok && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Baja registrada</AlertTitle>
          <AlertDescription>El stock quedó actualizado.</AlertDescription>
        </Alert>
      )}

      <div className="np-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="font-medium">{bajas.length}</span> bajas ·{" "}
          <span className="font-medium">{formatCajas(totalCajas)}</span> cajas
          dadas de baja
        </div>
        <ExportButtons
          filename="bajas"
          sheetName="Bajas"
          rows={rowsExport}
          columns={[
            { header: "Fecha", key: "fecha" },
            { header: "Modelo", key: "producto" },
            { header: "Sucursal", key: "sucursal" },
            { header: "Cajas", key: "cajas" },
            { header: "Motivo", key: "motivo" },
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
              <TableHead>Motivo</TableHead>
              <TableHead>Registrado por</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bajas.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatFecha(b.fecha)}</TableCell>
                <TableCell className="font-medium">{b.producto.nombre}</TableCell>
                <TableCell>
                  <SucursalChip sucursal={b.sucursal} />
                </TableCell>
                <TableCell className="text-right">
                  {formatCajas(b.cantidadCajas)}
                </TableCell>
                <TableCell>
                  <Badge variant="warning">{MOTIVO_LABEL[b.motivo]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {b.admin.nombre}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                  {b.notas ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {bajas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Todavía no hay bajas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
