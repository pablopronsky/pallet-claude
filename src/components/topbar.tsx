"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Rol, Sucursal } from "@prisma/client";

import { SignOutButton } from "@/components/sign-out-button";
import { ROL_LABEL, SUCURSAL_LABEL } from "@/lib/constants";

const ROUTE_LABEL: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/stock": "Stock actual",
  "/ingresos": "Ingresos",
  "/ingresos/nuevo": "Ingresos · Nuevo",
  "/ventas": "Ventas",
  "/ventas/nueva": "Ventas · Nueva",
  "/bajas": "Bajas",
  "/bajas/nueva": "Bajas · Nueva",
  "/historial": "Historial",
  "/productos": "Modelos",
  "/usuarios": "Usuarios",
  "/exportar": "Exportar",
};

function labelFor(path: string) {
  if (ROUTE_LABEL[path]) return ROUTE_LABEL[path];
  // fallback para subrutas no mapeadas
  const first = "/" + path.split("/").filter(Boolean)[0];
  return ROUTE_LABEL[first] ?? "Nuevo Parket";
}

function initials(name?: string | null, email?: string | null) {
  const base = (name ?? email ?? "NP").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
    rol: Rol;
    sucursal: Sucursal | null;
  };
};

export function Topbar({ user }: Props) {
  const pathname = usePathname();
  const label = labelFor(pathname);
  const contexto = user.sucursal ? SUCURSAL_LABEL[user.sucursal] : ROL_LABEL[user.rol];

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 md:px-8"
      style={{
        background: "color-mix(in oklab, var(--np-ink) 92%, transparent)",
        backdropFilter: "saturate(140%) blur(8px)",
        borderColor: "var(--np-line)",
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="np-kicker hidden sm:inline">Nuevo Parket</span>
        <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
        <span className="font-semibold tracking-tight">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-full border px-2.5 py-1 sm:flex"
          style={{ borderColor: "var(--np-line)", background: "var(--np-panel-2)" }}
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: "var(--np-green)" }}
          >
            {initials(user.name, user.email)}
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">{user.name ?? user.email}</p>
            <p className="text-[10.5px] text-muted-foreground">{contexto}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
