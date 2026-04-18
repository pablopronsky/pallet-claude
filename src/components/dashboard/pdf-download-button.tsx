"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/server/queries/dashboard";

type Props = {
  data: DashboardData;
  filtros: { desde?: string; hasta?: string; sucursal?: string };
  generadoPor: string;
};

// Botón que genera el PDF en el navegador (import dinámico para no traer la
// lib en el bundle inicial). Crea un Blob y dispara la descarga.
export function PDFDownloadButton({ data, filtros, generadoPor }: Props) {
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    try {
      const [{ pdf }, { DashboardPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/dashboard/pdf-document"),
      ]);

      const doc = (
        <DashboardPDFDocument
          data={data}
          filtros={filtros}
          generadoPor={generadoPor}
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-nuevo-parket-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generar}
      disabled={generando}
    >
      {generando ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}
