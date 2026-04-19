import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStockActual } from "@/server/queries/stock";
import { getMovimientos } from "@/server/queries/movimientos";
import { getDashboardData } from "@/server/queries/dashboard";
import { MOTIVO_LABEL, SUCURSAL_LABEL } from "@/lib/constants";
import { formatFecha, formatFechaHora, toNumber } from "@/lib/format";
import { ExportCards } from "@/components/exportar/export-cards";

export default async function ExportarPage() {
  const session = await auth();
  const user = session!.user;
  const sucursalForzada = user.rol === "VENDEDOR" ? user.sucursal! : undefined;

  const [stock, ventas, ingresos, bajas, historial, dashboardData] =
    await Promise.all([
      getStockActual(sucursalForzada ? { sucursal: sucursalForzada } : undefined),
      prisma.venta.findMany({
        where: sucursalForzada ? { sucursal: sucursalForzada } : {},
        orderBy: { fecha: "desc" },
        include: {
          producto: { select: { nombre: true } },
          ingreso: { select: { precioCostoPorCaja: true } },
          user: { select: { nombre: true } },
        },
      }),
      user.rol !== "VENDEDOR"
        ? prisma.ingreso.findMany({
            where: { origen: "PROVEEDOR" },
            orderBy: { fecha: "desc" },
            include: {
              producto: { select: { nombre: true } },
              admin: { select: { nombre: true } },
            },
          })
        : Promise.resolve([] as never[]),
      user.rol !== "VENDEDOR"
        ? prisma.baja.findMany({
            orderBy: { fecha: "desc" },
            include: {
              producto: { select: { nombre: true } },
              admin: { select: { nombre: true } },
            },
          })
        : Promise.resolve([] as never[]),
      getMovimientos({ sucursalForzada }),
      getDashboardData({ sucursalForzada }),
    ]);

  const stockRows = stock.map((f) => ({
    sucursal: SUCURSAL_LABEL[f.sucursal],
    producto: f.productoNombre,
    ingresado: f.ingresado,
    vendido: f.vendido,
    bajas: f.dadoDeBaja,
    stock: f.stock,
  }));

  const ventasRows = ventas.map((v) => ({
    fecha: formatFecha(v.fecha),
    producto: v.producto.nombre,
    sucursal: SUCURSAL_LABEL[v.sucursal],
    cajas: v.cantidadCajas,
    precioVenta: toNumber(v.precioVentaPorCaja),
    precioCosto: toNumber(v.ingreso.precioCostoPorCaja),
    totalVenta: toNumber(v.precioVentaPorCaja) * v.cantidadCajas,
    utilidad:
      (toNumber(v.precioVentaPorCaja) - toNumber(v.ingreso.precioCostoPorCaja)) *
      v.cantidadCajas,
    vendedor: v.user.nombre,
    notas: v.notas ?? "",
  }));

  const ingresosRows = ingresos.map((i) => ({
    fecha: formatFecha(i.fecha),
    producto: i.producto.nombre,
    sucursal: SUCURSAL_LABEL[i.sucursal],
    cajas: i.cantidadCajas,
    precioCosto: toNumber(i.precioCostoPorCaja),
    subtotal: toNumber(i.precioCostoPorCaja) * i.cantidadCajas,
    registradoPor: i.admin.nombre,
    notas: i.notas ?? "",
  }));

  const bajasRows = bajas.map((b) => ({
    fecha: formatFecha(b.fecha),
    producto: b.producto.nombre,
    sucursal: SUCURSAL_LABEL[b.sucursal],
    cajas: b.cantidadCajas,
    motivo: MOTIVO_LABEL[b.motivo],
    registradoPor: b.admin.nombre,
    notas: b.notas ?? "",
  }));

  const historialRows = historial.map((m) => ({
    fecha: formatFechaHora(m.fecha),
    tipo: m.tipo,
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

  const datasets = [
    {
      id: "stock",
      titulo: "Stock actual",
      descripcion: "Ingresado · vendido · bajas · stock por sucursal y modelo.",
      formato: "xlsx" as const,
      filename: "stock.xlsx",
      sheetName: "Stock",
      columns: [
        { header: "Sucursal", key: "sucursal" },
        { header: "Modelo", key: "producto" },
        { header: "Ingresado", key: "ingresado" },
        { header: "Vendido", key: "vendido" },
        { header: "Bajas", key: "bajas" },
        { header: "Stock", key: "stock" },
      ],
      rows: stockRows,
    },
    {
      id: "ventas",
      titulo: "Ventas",
      descripcion: "Detalle con precio, costo FIFO y utilidad bruta por línea.",
      formato: "xlsx" as const,
      filename: "ventas.xlsx",
      sheetName: "Ventas",
      columns: [
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
      ],
      rows: ventasRows,
    },
    ...(user.rol === "ADMIN"
      ? [
          {
            id: "ingresos",
            titulo: "Ingresos",
            descripcion:
              "Cajas recibidas en consignación desde All Covering SRL.",
            formato: "xlsx" as const,
            filename: "ingresos.xlsx",
            sheetName: "Ingresos",
            columns: [
              { header: "Fecha", key: "fecha" },
              { header: "Modelo", key: "producto" },
              { header: "Sucursal", key: "sucursal" },
              { header: "Cajas", key: "cajas" },
              { header: "Costo/caja", key: "precioCosto" },
              { header: "Subtotal", key: "subtotal" },
              { header: "Registrado por", key: "registradoPor" },
              { header: "Notas", key: "notas" },
            ],
            rows: ingresosRows,
          },
          {
            id: "bajas",
            titulo: "Bajas",
            descripcion: "Muestras, roturas y donaciones. No impactan deuda.",
            formato: "xlsx" as const,
            filename: "bajas.xlsx",
            sheetName: "Bajas",
            columns: [
              { header: "Fecha", key: "fecha" },
              { header: "Modelo", key: "producto" },
              { header: "Sucursal", key: "sucursal" },
              { header: "Cajas", key: "cajas" },
              { header: "Motivo", key: "motivo" },
              { header: "Registrado por", key: "registradoPor" },
              { header: "Notas", key: "notas" },
            ],
            rows: bajasRows,
          },
        ]
      : []),
    {
      id: "historial",
      titulo: "Historial completo",
      descripcion: "Ingresos, ventas y bajas en un único archivo CSV.",
      formato: "csv" as const,
      filename: "historial.csv",
      sheetName: "Historial",
      columns: [
        { header: "Fecha", key: "fecha" },
        { header: "Tipo", key: "tipo" },
        { header: "Modelo", key: "producto" },
        { header: "Sucursal", key: "sucursal" },
        { header: "Cajas", key: "cajas" },
        { header: "Precio/caja", key: "precioUnitario" },
        { header: "Total", key: "total" },
        { header: "Motivo", key: "motivo" },
        { header: "Usuario", key: "usuario" },
        { header: "Notas", key: "notas" },
      ],
      rows: historialRows,
    },
    {
      id: "dashboard",
      titulo: "Dashboard PDF",
      descripcion:
        "Reporte visual con métricas, top modelos y evolución mensual.",
      formato: "pdf" as const,
      filename: `dashboard-nuevo-parket-${Date.now()}.pdf`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
          Reportes
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Exportar
        </h1>
        <p className="text-sm text-muted-foreground">
          Descargá los datasets más importantes en un click. Excel para Google
          Sheets, CSV para sistemas externos, PDF para compartir.
        </p>
      </div>

      <ExportCards
        datasets={datasets}
        dashboard={{
          data: dashboardData,
          filtros: sucursalForzada ? { sucursal: sucursalForzada } : {},
          generadoPor: user.name ?? user.email ?? "Usuario",
        }}
      />
    </div>
  );
}
