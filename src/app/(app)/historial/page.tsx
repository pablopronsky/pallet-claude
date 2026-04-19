import {
  ArrowDownToLine,
  ArrowUpFromLine,
  MinusCircle,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filtrosSchema } from "@/schemas/filtros";
import { getMovimientos, type Movimiento } from "@/server/queries/movimientos";
import { MOTIVO_LABEL, SUCURSAL_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { SucursalChip } from "@/components/sucursal-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/export-buttons";
import { FiltrosForm } from "@/components/filtros-form";
import { ViewToggle } from "@/components/historial/view-toggle";
import { formatARS, formatCajas, formatFechaHora } from "@/lib/format";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

const LABEL_TIPO: Record<string, string> = {
  INGRESO: "Ingreso",
  VENTA: "Venta",
  BAJA: "Baja",
  TRANSFERENCIA: "Transferencia",
  LIQUIDACION: "Liquidación",
};

const COLOR_TIPO: Record<string, string> = {
  INGRESO: "var(--np-green)",
  VENTA: "var(--np-orange)",
  BAJA: "#ef4444",
  TRANSFERENCIA: "#3b82f6",
  LIQUIDACION: "#a855f7",
};

function TipoBadge({ tipo }: { tipo: Movimiento["tipo"] }) {
  const color = COLOR_TIPO[tipo];
  const Icon =
    tipo === "INGRESO"
      ? ArrowDownToLine
      : tipo === "VENTA"
        ? ArrowUpFromLine
        : tipo === "BAJA"
          ? MinusCircle
          : tipo === "TRANSFERENCIA"
            ? ArrowLeftRight
            : Wallet;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
      }}
    >
      <Icon className="h-3 w-3" />
      {LABEL_TIPO[tipo]}
    </span>
  );
}

export default async function HistorialPage({ searchParams }: PageProps) {
  const session = await auth();
  const user = session!.user;

  const sp = await searchParams;
  const filtros = filtrosSchema.parse(sp);

  const [productos, movimientos] = await Promise.all([
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    getMovimientos({
      ...filtros,
      sucursalForzada: user.rol === "VENDEDOR" ? user.sucursal! : undefined,
    }),
  ]);

  const rowsExport = movimientos.map((m) => ({
    fecha: formatFechaHora(m.fecha),
    tipo: LABEL_TIPO[m.tipo] ?? m.tipo,
    producto: m.productoNombre,
    sucursal: m.sucursal ? SUCURSAL_LABEL[m.sucursal] : "—",
    sucursalDestino: m.sucursalDestino ? SUCURSAL_LABEL[m.sucursalDestino] : "",
    cajas: m.cantidadCajas ?? "",
    precioUnitario: m.precioUnitario ?? "",
    total: m.total ?? "",
    motivo: m.motivo ? MOTIVO_LABEL[m.motivo] : "",
    usuario: m.usuarioNombre,
    notas: m.notas ?? "",
  }));

  const tabla = (
    <div className="np-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead className="text-right">Cajas</TableHead>
            <TableHead className="text-right">Precio/caja</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Motivo / Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="whitespace-nowrap text-sm tabular">
                {formatFechaHora(m.fecha)}
              </TableCell>
              <TableCell>
                <TipoBadge tipo={m.tipo} />
              </TableCell>
              <TableCell className="font-medium">{m.productoNombre}</TableCell>
              <TableCell>
                {m.sucursal ? (
                  m.sucursalDestino ? (
                    <span className="inline-flex items-center gap-1.5">
                      <SucursalChip sucursal={m.sucursal} />
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <SucursalChip sucursal={m.sucursalDestino} />
                    </span>
                  ) : (
                    <SucursalChip sucursal={m.sucursal} />
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular">
                {m.cantidadCajas !== null ? formatCajas(m.cantidadCajas) : "—"}
              </TableCell>
              <TableCell className="text-right tabular">
                {m.precioUnitario !== null ? formatARS(m.precioUnitario) : "—"}
              </TableCell>
              <TableCell className="text-right tabular">
                {m.total !== null ? formatARS(m.total) : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {m.motivo
                  ? `${MOTIVO_LABEL[m.motivo]} · ${m.usuarioNombre}`
                  : m.usuarioNombre}
              </TableCell>
            </TableRow>
          ))}
          {movimientos.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-muted-foreground"
              >
                No se encontraron movimientos con los filtros aplicados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const cards =
    movimientos.length === 0 ? (
      <div className="np-card p-12 text-center text-sm text-muted-foreground">
        No se encontraron movimientos con los filtros aplicados.
      </div>
    ) : (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {movimientos.map((m) => (
          <article key={m.id} className="np-card p-4">
            <header className="mb-2 flex items-center justify-between">
              <TipoBadge tipo={m.tipo} />
              <span className="text-[11px] tabular text-muted-foreground">
                {formatFechaHora(m.fecha)}
              </span>
            </header>
            <p className="text-[15px] font-semibold leading-tight">
              {m.productoNombre}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {m.sucursal && <SucursalChip sucursal={m.sucursal} />}
              {m.sucursalDestino && (
                <>
                  <ArrowLeftRight className="h-3 w-3" />
                  <SucursalChip sucursal={m.sucursalDestino} />
                </>
              )}
              {m.cantidadCajas !== null && (
                <>
                  <span>·</span>
                  <span className="tabular font-medium text-foreground">
                    {formatCajas(m.cantidadCajas)} cajas
                  </span>
                </>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {m.precioUnitario !== null && (
                <div>
                  <dt className="text-muted-foreground">Precio/caja</dt>
                  <dd className="font-medium tabular">
                    {formatARS(m.precioUnitario)}
                  </dd>
                </div>
              )}
              {m.total !== null && (
                <div>
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="font-semibold tabular">
                    {formatARS(m.total)}
                  </dd>
                </div>
              )}
              {m.motivo && (
                <div>
                  <dt className="text-muted-foreground">Motivo</dt>
                  <dd>
                    <Badge variant="warning">{MOTIVO_LABEL[m.motivo]}</Badge>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Usuario</dt>
                <dd>{m.usuarioNombre}</dd>
              </div>
            </dl>
            {m.notas && (
              <p
                className="mt-3 rounded-md border px-2.5 py-1.5 text-[11px] leading-snug text-muted-foreground"
                style={{ borderColor: "var(--np-line)", background: "var(--np-panel-2)" }}
              >
                {m.notas}
              </p>
            )}
          </article>
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
          Auditoría
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Historial de movimientos
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresos, ventas y bajas en una sola vista. Cambiá entre tabla o
          cards.
        </p>
      </div>

      <FiltrosForm
        action="/historial"
        permitirSucursal={user.rol === "ADMIN"}
        productos={productos}
        mostrarTipo
        defaultValues={{
          desde: sp.desde ?? "",
          hasta: sp.hasta ?? "",
          sucursal: (sp.sucursal as typeof filtros.sucursal) ?? "",
          productoId: sp.productoId ?? "",
          tipo: (sp.tipo as typeof filtros.tipo) ?? "",
        }}
      />

      <div className="np-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="font-semibold tabular">{movimientos.length}</span>{" "}
          <span className="text-muted-foreground">movimientos</span>
        </div>
        <ExportButtons
          filename="historial"
          sheetName="Historial"
          rows={rowsExport}
          columns={[
            { header: "Fecha", key: "fecha" },
            { header: "Tipo", key: "tipo" },
            { header: "Modelo", key: "producto" },
            { header: "Sucursal", key: "sucursal" },
            { header: "Destino", key: "sucursalDestino" },
            { header: "Cajas", key: "cajas" },
            { header: "Precio/caja", key: "precioUnitario" },
            { header: "Total", key: "total" },
            { header: "Motivo", key: "motivo" },
            { header: "Usuario", key: "usuario" },
            { header: "Notas", key: "notas" },
          ]}
        />
      </div>

      <ViewToggle tablaNode={tabla} cardsNode={cards} />
    </div>
  );
}
