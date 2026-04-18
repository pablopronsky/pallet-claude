import type { Sucursal } from "@prisma/client";

import { SUCURSAL_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CLASS: Record<Sucursal, string> = {
  QUILMES: "np-chip np-chip-quilmes",
  LA_PLATA: "np-chip np-chip-laplata",
  GONNET: "np-chip np-chip-gonnet",
};

export function SucursalChip({
  sucursal,
  className,
}: {
  sucursal: Sucursal;
  className?: string;
}) {
  return (
    <span className={cn(CLASS[sucursal], className)}>
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      {SUCURSAL_LABEL[sucursal]}
    </span>
  );
}
