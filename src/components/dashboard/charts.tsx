"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SUCURSAL_LABEL } from "@/lib/constants";
import { formatARS, formatCajas } from "@/lib/format";
import type {
  PuntoEvolucion,
  TopModelo,
  VentasPorSucursal,
} from "@/server/queries/dashboard";

const COLOR_SUCURSAL: Record<string, string> = {
  QUILMES: "#eab308",
  LA_PLATA: "#3b82f6",
  GONNET: "#ef4444",
};

const COLOR_TOP = ["#006730", "#1a7d44", "#2b9157", "#43a46a", "#62b680"];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "#15181c",
  border: "1px solid #2a2e33",
  borderRadius: 8,
  fontSize: 12,
  color: "#e8eaec",
};
const GRID_STROKE = "#2a2e33";
const AXIS_TICK = { fill: "#9aa0a6", fontSize: 11 } as const;

function formatAxisNumber(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

export function ChartVentasPorSucursal({
  data,
}: {
  data: VentasPorSucursal[];
}) {
  if (data.length === 0) {
    return <EmptyChart mensaje="Sin ventas en el período seleccionado." />;
  }

  const formatted = data.map((d) => ({
    sucursal: SUCURSAL_LABEL[d.sucursal],
    sucursalKey: d.sucursal,
    total: d.total,
    cajas: d.cajas,
    utilidad: d.utilidad,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="sucursal" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
          tickFormatter={formatAxisNumber}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(value: number, name) => {
            if (name === "cajas") return [formatCajas(value), "Cajas"];
            return [formatARS(value), name === "utilidad" ? "Utilidad" : "Total"];
          }}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {formatted.map((d) => (
            <Cell key={d.sucursalKey} fill={COLOR_SUCURSAL[d.sucursalKey] ?? "#006730"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChartTopModelos({ data }: { data: TopModelo[] }) {
  if (data.length === 0) {
    return <EmptyChart mensaje="Sin ventas para rankear modelos." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickFormatter={(v: number) => formatCajas(v)}
        />
        <YAxis
          type="category"
          dataKey="productoNombre"
          width={170}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          interval={0}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(value: number, name) => {
            if (name === "cajas") return [formatCajas(value), "Cajas"];
            return [formatARS(value), "Total"];
          }}
        />
        <Bar dataKey="cajas" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLOR_TOP[i % COLOR_TOP.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChartEvolucion({ data }: { data: PuntoEvolucion[] }) {
  if (data.length === 0) {
    return <EmptyChart mensaje="Sin datos temporales para graficar." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
          tickFormatter={formatAxisNumber}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number, name) => [
            formatARS(value),
            name === "utilidad" ? "Utilidad" : "Ventas",
          ]}
        />
        <Line type="monotone" dataKey="ventas" stroke="#006730" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="utilidad" stroke="#ef7f1a" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SparklineDeuda({ data }: { data: PuntoEvolucion[] }) {
  if (data.length === 0) {
    return <div className="h-14" aria-hidden />;
  }
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id="spark-deuda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef7f1a" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ef7f1a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="ventas"
          stroke="#ef7f1a"
          strokeWidth={2}
          fill="url(#spark-deuda)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChartUtilidadPorSucursal({ data }: { data: VentasPorSucursal[] }) {
  if (data.length === 0) {
    return <EmptyChart mensaje="Sin utilidad para el período." />;
  }
  const formatted = data.map((d) => ({
    sucursal: SUCURSAL_LABEL[d.sucursal],
    sucursalKey: d.sucursal,
    utilidad: d.utilidad,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="sucursal" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
          tickFormatter={formatAxisNumber}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(value: number) => [formatARS(value), "Utilidad"]}
        />
        <Bar dataKey="utilidad" fill="#ef7f1a" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ mensaje }: { mensaje: string }) {
  return (
    <div
      className="flex h-[260px] items-center justify-center rounded-md border text-sm text-muted-foreground"
      style={{ borderColor: "var(--np-line)", background: "var(--np-panel-2)" }}
    >
      {mensaje}
    </div>
  );
}
