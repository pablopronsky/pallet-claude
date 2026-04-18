"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { SUCURSAL_LABEL } from "@/lib/constants";
import type { DashboardData } from "@/server/queries/dashboard";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 6 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  grid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
  },
  cardLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase" },
  cardValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  trLast: { flexDirection: "row" },
  th: {
    flex: 1,
    padding: 6,
    backgroundColor: "#f1f5f9",
    fontWeight: 700,
    fontSize: 9,
  },
  td: { flex: 1, padding: 6, fontSize: 9 },
  right: { textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("es-AR").format(n);
}

type Props = {
  data: DashboardData;
  filtros: {
    desde?: string;
    hasta?: string;
    sucursal?: string;
  };
  generadoPor: string;
  generadoEn: string;
};

export function DashboardPDFDocument({
  data,
  filtros,
  generadoPor,
  generadoEn,
}: Props) {
  const rangoTxt =
    filtros.desde || filtros.hasta
      ? `${filtros.desde ?? "inicio"} – ${filtros.hasta ?? "hoy"}`
      : "Todo el histórico";
  const sucursalTxt = filtros.sucursal
    ? SUCURSAL_LABEL[filtros.sucursal as keyof typeof SUCURSAL_LABEL] ??
      filtros.sucursal
    : "Todas las sucursales";

  return (
    <Document title="Dashboard Nuevo Parket">
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Nuevo Parket — Control de Consignación</Text>
        <Text style={styles.subtitle}>
          {sucursalTxt} · {rangoTxt} · Generado por {generadoPor} el {generadoEn}
        </Text>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Deuda con All Covering</Text>
            <Text style={styles.cardValue}>{fmtARS(data.deudaTotal)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Utilidad bruta</Text>
            <Text style={styles.cardValue}>{fmtARS(data.utilidadTotal)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total facturado</Text>
            <Text style={styles.cardValue}>{fmtARS(data.totalVendido)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cajas ingresadas</Text>
            <Text style={styles.cardValue}>{fmtNum(data.cajasIngresadas)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cajas vendidas</Text>
            <Text style={styles.cardValue}>{fmtNum(data.cajasVendidas)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Bajas</Text>
            <Text style={styles.cardValue}>{fmtNum(data.cajasDadasDeBaja)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Stock actual</Text>
            <Text style={styles.cardValue}>{fmtNum(data.stockCajas)}</Text>
          </View>
        </View>

        <Text style={styles.h2}>Ventas por sucursal</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Sucursal</Text>
            <Text style={[styles.th, styles.right]}>Cajas</Text>
            <Text style={[styles.th, styles.right]}>Total</Text>
            <Text style={[styles.th, styles.right]}>Utilidad</Text>
          </View>
          {data.ventasPorSucursal.length === 0 && (
            <View style={styles.trLast}>
              <Text style={styles.td}>Sin ventas.</Text>
            </View>
          )}
          {data.ventasPorSucursal.map((s, i, arr) => (
            <View
              key={s.sucursal}
              style={i === arr.length - 1 ? styles.trLast : styles.tr}
            >
              <Text style={styles.td}>{SUCURSAL_LABEL[s.sucursal]}</Text>
              <Text style={[styles.td, styles.right]}>{fmtNum(s.cajas)}</Text>
              <Text style={[styles.td, styles.right]}>{fmtARS(s.total)}</Text>
              <Text style={[styles.td, styles.right]}>
                {fmtARS(s.utilidad)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Top 5 modelos más vendidos</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 3 }]}>Modelo</Text>
            <Text style={[styles.th, styles.right]}>Cajas</Text>
            <Text style={[styles.th, styles.right]}>Total</Text>
          </View>
          {data.topModelos.length === 0 && (
            <View style={styles.trLast}>
              <Text style={styles.td}>Sin datos.</Text>
            </View>
          )}
          {data.topModelos.map((m, i, arr) => (
            <View
              key={m.productoId}
              style={i === arr.length - 1 ? styles.trLast : styles.tr}
            >
              <Text style={[styles.td, { flex: 3 }]}>{m.productoNombre}</Text>
              <Text style={[styles.td, styles.right]}>{fmtNum(m.cajas)}</Text>
              <Text style={[styles.td, styles.right]}>{fmtARS(m.total)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Evolución mensual</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Mes</Text>
            <Text style={[styles.th, styles.right]}>Ventas</Text>
            <Text style={[styles.th, styles.right]}>Utilidad</Text>
          </View>
          {data.evolucion.length === 0 && (
            <View style={styles.trLast}>
              <Text style={styles.td}>Sin datos.</Text>
            </View>
          )}
          {data.evolucion.map((p, i, arr) => (
            <View
              key={p.mes}
              style={i === arr.length - 1 ? styles.trLast : styles.tr}
            >
              <Text style={styles.td}>{p.mes}</Text>
              <Text style={[styles.td, styles.right]}>{fmtARS(p.ventas)}</Text>
              <Text style={[styles.td, styles.right]}>
                {fmtARS(p.utilidad)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Stock por sucursal y modelo</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Sucursal</Text>
            <Text style={[styles.th, { flex: 2 }]}>Modelo</Text>
            <Text style={[styles.th, styles.right]}>Ingresado</Text>
            <Text style={[styles.th, styles.right]}>Vendido</Text>
            <Text style={[styles.th, styles.right]}>Bajas</Text>
            <Text style={[styles.th, styles.right]}>Stock</Text>
          </View>
          {data.stock.length === 0 && (
            <View style={styles.trLast}>
              <Text style={styles.td}>Sin datos.</Text>
            </View>
          )}
          {data.stock.map((f, i, arr) => (
            <View
              key={`${f.productoId}-${f.sucursal}`}
              style={i === arr.length - 1 ? styles.trLast : styles.tr}
            >
              <Text style={styles.td}>{SUCURSAL_LABEL[f.sucursal]}</Text>
              <Text style={[styles.td, { flex: 2 }]}>{f.productoNombre}</Text>
              <Text style={[styles.td, styles.right]}>
                {fmtNum(f.ingresado)}
              </Text>
              <Text style={[styles.td, styles.right]}>{fmtNum(f.vendido)}</Text>
              <Text style={[styles.td, styles.right]}>
                {fmtNum(f.dadoDeBaja)}
              </Text>
              <Text style={[styles.td, styles.right]}>{fmtNum(f.stock)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Nuevo Parket · Reporte generado automáticamente
        </Text>
      </Page>
    </Document>
  );
}
