"use client";

import { FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ColumnaExport = {
  header: string;
  key: string;
};

type Row = Record<string, string | number | null | undefined>;

type Props = {
  filename: string;
  sheetName?: string;
  columns: ColumnaExport[];
  rows: Row[];
};

// Botones de exportación a Excel (.xlsx) y CSV. Las columnas usan keys (no
// funciones) porque este es un Client Component y las props tienen que ser
// serializables desde el Server Component que lo renderiza.
export function ExportButtons({
  filename,
  sheetName = "Datos",
  columns,
  rows,
}: Props) {
  async function exportar(tipo: "xlsx" | "csv") {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => {
      const fila: Row = {};
      for (const col of columns) fila[col.header] = r[col.key] ?? "";
      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(data, {
      header: columns.map((c) => c.header),
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    if (tipo === "xlsx") {
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else {
      XLSX.writeFile(wb, `${filename}.csv`, { bookType: "csv" });
    }
  }

  const disabled = rows.length === 0;

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportar("xlsx")}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportar("csv")}
      >
        <FileText className="mr-2 h-4 w-4" />
        CSV
      </Button>
    </div>
  );
}
