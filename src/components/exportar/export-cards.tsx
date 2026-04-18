"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileDown,
  Loader2,
  Download,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardData } from "@/server/queries/dashboard";

type Row = Record<string, string | number | null>;

type Dataset = {
  id: string;
  titulo: string;
  descripcion: string;
  formato: "xlsx" | "csv" | "pdf";
  filename: string;
  sheetName?: string;
  columns?: { header: string; key: string }[];
  rows?: Row[];
};

type Props = {
  datasets: Dataset[];
  dashboard: {
    data: DashboardData;
    filtros: { desde?: string; hasta?: string; sucursal?: string };
    generadoPor: string;
  };
};

const FORMATO_LABEL: Record<Dataset["formato"], string> = {
  xlsx: "Excel",
  csv: "CSV",
  pdf: "PDF",
};

const FORMATO_COLOR: Record<Dataset["formato"], string> = {
  xlsx: "#22c55e",
  csv: "#3b82f6",
  pdf: "#ef4444",
};

const FORMATO_ICON: Record<Dataset["formato"], React.ComponentType<{ className?: string }>> = {
  xlsx: FileSpreadsheet,
  csv: FileText,
  pdf: FileDown,
};

export function ExportCards({ datasets, dashboard }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function descargar(ds: Dataset) {
    setBusyId(ds.id);
    try {
      if (ds.formato === "pdf") {
        const [{ pdf }, { DashboardPDFDocument }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/dashboard/pdf-document"),
        ]);
        const doc = (
          <DashboardPDFDocument
            data={dashboard.data}
            filtros={dashboard.filtros}
            generadoPor={dashboard.generadoPor}
            generadoEn={new Intl.DateTimeFormat("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date())}
          />
        );
        const blob = await pdf(doc).toBlob();
        triggerDownload(blob, ds.filename);
        return;
      }

      const XLSX = await import("xlsx");
      const rows = ds.rows ?? [];
      const cols = ds.columns ?? [];
      const mapped = rows.map((r) => {
        const fila: Row = {};
        for (const c of cols) fila[c.header] = r[c.key] ?? "";
        return fila;
      });
      const ws = XLSX.utils.json_to_sheet(mapped, {
        header: cols.map((c) => c.header),
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, (ds.sheetName ?? "Datos").slice(0, 31));
      XLSX.writeFile(
        wb,
        ds.filename,
        ds.formato === "csv" ? { bookType: "csv" } : undefined,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {datasets.map((ds) => {
        const Icon = FORMATO_ICON[ds.formato];
        const color = FORMATO_COLOR[ds.formato];
        const busy = busyId === ds.id;
        const empty =
          ds.formato !== "pdf" && (ds.rows?.length ?? 0) === 0;
        return (
          <button
            key={ds.id}
            type="button"
            onClick={() => descargar(ds)}
            disabled={busy || empty}
            className={cn(
              "np-card group flex flex-col items-start gap-3 p-5 text-left transition",
              "hover:border-[color:var(--np-green)]/40 hover:shadow-lg",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <div className="flex w-full items-start justify-between">
              <span
                className="grid h-11 w-11 place-items-center rounded-lg"
                style={{
                  background: `color-mix(in oklab, ${color} 16%, transparent)`,
                  color,
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className="np-chip"
                style={{
                  background: `color-mix(in oklab, ${color} 16%, transparent)`,
                  color,
                }}
              >
                {FORMATO_LABEL[ds.formato]}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-tight">
                {ds.titulo}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {ds.descripcion}
              </p>
              {ds.formato !== "pdf" && (
                <p className="mt-2 text-[11px] tabular text-muted-foreground">
                  {ds.rows?.length ?? 0} filas
                </p>
              )}
            </div>
            <span
              className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: busy ? "var(--np-text-dim)" : "var(--np-green-400)" }}
            >
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generando...
                </>
              ) : empty ? (
                "Sin datos aún"
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" /> Descargar
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
