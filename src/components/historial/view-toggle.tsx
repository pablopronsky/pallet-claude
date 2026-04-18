"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "np-historial-view";

type View = "tabla" | "cards";

export function ViewToggle({
  tablaNode,
  cardsNode,
}: {
  tablaNode: React.ReactNode;
  cardsNode: React.ReactNode;
}) {
  const [view, setView] = useState<View>("tabla");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "cards" || saved === "tabla") setView(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, view);
  }, [view, hydrated]);

  return (
    <>
      <div className="flex justify-end">
        <div
          role="tablist"
          aria-label="Modo de visualización"
          className="inline-flex items-center gap-1 rounded-full border p-1"
          style={{ borderColor: "var(--np-line)", background: "var(--np-panel-2)" }}
        >
          <Pill
            active={view === "tabla"}
            onClick={() => setView("tabla")}
            icon={<List className="h-3.5 w-3.5" />}
          >
            Tabla
          </Pill>
          <Pill
            active={view === "cards"}
            onClick={() => setView("cards")}
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
          >
            Cards
          </Pill>
        </div>
      </div>
      {view === "tabla" ? tablaNode : cardsNode}
    </>
  );
}

function Pill({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      style={active ? { background: "var(--np-green)" } : undefined}
    >
      {icon}
      {children}
    </button>
  );
}
