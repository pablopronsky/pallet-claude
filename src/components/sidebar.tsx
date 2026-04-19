"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  TruckIcon,
  ShoppingCart,
  MinusCircle,
  ClipboardList,
  Users,
  Layers,
  Download,
  ArrowLeftRight,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Rol } from "@prisma/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Rol[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VENDEDOR"] },
  { href: "/stock", label: "Stock actual", icon: PackageSearch, roles: ["ADMIN", "VENDEDOR"] },
  { href: "/ingresos", label: "Ingresos", icon: TruckIcon, roles: ["ADMIN"] },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart, roles: ["ADMIN", "VENDEDOR"] },
  { href: "/transferencias", label: "Transferencias", icon: ArrowLeftRight, roles: ["ADMIN"] },
  { href: "/bajas", label: "Bajas", icon: MinusCircle, roles: ["ADMIN"] },
  { href: "/liquidaciones", label: "Liquidaciones", icon: Wallet, roles: ["ADMIN"] },
  { href: "/historial", label: "Historial", icon: ClipboardList, roles: ["ADMIN", "VENDEDOR"] },
  { href: "/productos", label: "Modelos", icon: Layers, roles: ["ADMIN"] },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
  { href: "/exportar", label: "Exportar", icon: Download, roles: ["ADMIN", "VENDEDOR"] },
];

type SidebarProps = {
  user: { rol: Rol };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const items = NAV_ITEMS.filter((it) => it.roles.includes(user.rol));

  return (
    <>
      {/* Barra superior mobile */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{ background: "var(--np-panel)", borderColor: "var(--np-line)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-base font-semibold tracking-tight">Nuevo Parket</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAbierto((v) => !v)}
          aria-label="Abrir menú"
        >
          {abierto ? <X /> : <Menu />}
        </Button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r transition-transform md:static md:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "var(--np-panel)", borderColor: "var(--np-line)" }}
      >
        <div
          className="flex items-center gap-2.5 border-b px-5 py-5"
          style={{ borderColor: "var(--np-line)" }}
        >
          <BrandMark />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-foreground">
              Nuevo Parket
            </p>
            <p className="text-[11px] text-muted-foreground">Control de consignación</p>
          </div>
        </div>

        <p className="np-kicker px-5 pb-2 pt-5">Menú</p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                )}
                style={
                  active
                    ? { background: "color-mix(in oklab, var(--np-green) 18%, transparent)" }
                    : undefined
                }
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1 left-0 w-[3px] rounded-r"
                    style={{ background: "var(--np-green)" }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="border-t px-5 py-4 text-[11px] leading-relaxed text-muted-foreground"
          style={{ borderColor: "var(--np-line)" }}
        >
          <p className="np-kicker mb-1">Proveedor</p>
          <p className="text-foreground/80">All Covering SRL</p>
        </div>
      </aside>

      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}
    </>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 place-items-center rounded-md text-[13px] font-bold text-white"
      style={{ background: "var(--np-green)" }}
    >
      NP
    </span>
  );
}
