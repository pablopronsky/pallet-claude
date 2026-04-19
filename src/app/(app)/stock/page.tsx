import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filtrosSchema } from "@/schemas/filtros";
import { getStockActual } from "@/server/queries/stock";
import { SUCURSAL_LABEL } from "@/lib/constants";
import { SucursalChip } from "@/components/sucursal-chip";
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
import { FiltrosForm } from "@/components/filtros-form";
import { formatCajas } from "@/lib/format";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function StockPage({ searchParams }: PageProps) {
  const session = await auth();
  const user = session!.user;

  const sp = await searchParams;
  const filtros = filtrosSchema.parse(sp);

  // Vendedor: siempre su sucursal. Admin: según filtro.
  const sucursalAplicada =
    user.rol === "VENDEDOR" ? user.sucursal! : filtros.sucursal;

  const [productos, stock] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    getStockActual({
      sucursal: sucursalAplicada ?? undefined,
      productoId: filtros.productoId,
    }),
  ]);

  const totalIngresado = stock.reduce((a, f) => a + f.ingresado, 0);
  const totalVendido = stock.reduce((a, f) => a + f.vendido, 0);
  const totalBajas = stock.reduce((a, f) => a + f.dadoDeBaja, 0);
  const totalStock = stock.reduce((a, f) => a + f.stock, 0);

  const rowsExport = stock.map((f) => ({
    sucursal: SUCURSAL_LABEL[f.sucursal],
    producto: f.productoNombre,
    ingresado: f.ingresado,
    vendido: f.vendido,
    bajas: f.dadoDeBaja,
    stock: f.stock,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
          Disponibilidad
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Stock actual
        </h1>
        <p className="text-sm text-muted-foreground">
          Cajas disponibles por sucursal y modelo. Cálculo en vivo:
          ingresado − vendido − bajas.
        </p>
      </div>

      <FiltrosForm
        action="/stock"
        permitirSucursal={user.rol === "ADMIN"}
        productos={productos}
        defaultValues={{
          sucursal: (sp.sucursal as typeof filtros.sucursal) ?? "",
          productoId: sp.productoId ?? "",
        }}
      />

      <div className="np-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="font-medium">{stock.length}</span> combinaciones ·{" "}
          <span className="font-medium">{formatCajas(totalStock)}</span> cajas
          en stock
        </div>
        <ExportButtons
          filename="stock"
          sheetName="Stock"
          rows={rowsExport}
          columns={[
            { header: "Sucursal", key: "sucursal" },
            { header: "Modelo", key: "producto" },
            { header: "Ingresado", key: "ingresado" },
            { header: "Vendido", key: "vendido" },
            { header: "Bajas", key: "bajas" },
            { header: "Stock", key: "stock" },
          ]}
        />
      </div>

      <div className="np-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sucursal</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-right">Ingresado</TableHead>
              <TableHead className="text-right">Vendido</TableHead>
              <TableHead className="text-right">Bajas</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.map((f) => {
              const enAlerta = f.stockMinimo > 0 && f.stock <= f.stockMinimo;
              return (
                <TableRow key={`${f.productoId}-${f.sucursal}`}>
                  <TableCell>
                    <SucursalChip sucursal={f.sucursal} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {f.productoNombre}
                    {enAlerta && (
                      <span
                        className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          background:
                            "color-mix(in oklab, var(--np-orange) 22%, transparent)",
                          color: "var(--np-orange)",
                        }}
                        title={`Stock bajo (mínimo ${f.stockMinimo})`}
                      >
                        bajo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCajas(f.ingresado)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCajas(f.vendido)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCajas(f.dadoDeBaja)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span
                      style={
                        enAlerta ? { color: "var(--np-orange)" } : undefined
                      }
                      className={
                        f.stock === 0
                          ? "text-muted-foreground"
                          : f.stock < 0
                            ? "text-destructive"
                            : ""
                      }
                    >
                      {formatCajas(f.stock)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {stock.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No hay movimientos todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {stock.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Totales
                </TableCell>
                <TableCell className="text-right">
                  {formatCajas(totalIngresado)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCajas(totalVendido)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCajas(totalBajas)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCajas(totalStock)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
