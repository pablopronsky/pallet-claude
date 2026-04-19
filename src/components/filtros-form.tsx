import Link from "next/link";
import type { Sucursal } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SUCURSALES, SUCURSAL_LABEL } from "@/lib/constants";

type Producto = { id: string; nombre: string };

type Props = {
  action: string; // URL base (ej: "/movimientos")
  permitirSucursal?: boolean; // admin sí, vendedor no
  defaultValues: {
    desde?: string;
    hasta?: string;
    sucursal?: Sucursal | "";
    productoId?: string;
    tipo?: "INGRESO" | "VENTA" | "BAJA" | "TRANSFERENCIA" | "LIQUIDACION" | "";
  };
  productos?: Producto[];
  mostrarTipo?: boolean;
};

export function FiltrosForm({
  action,
  permitirSucursal = true,
  defaultValues,
  productos,
  mostrarTipo = false,
}: Props) {
  return (
    <form
      method="GET"
      action={action}
      className="np-card grid gap-3 p-4 md:grid-cols-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="desde" className="text-xs">Desde</Label>
        <Input
          type="date"
          id="desde"
          name="desde"
          defaultValue={defaultValues.desde ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hasta" className="text-xs">Hasta</Label>
        <Input
          type="date"
          id="hasta"
          name="hasta"
          defaultValue={defaultValues.hasta ?? ""}
        />
      </div>

      {permitirSucursal && (
        <div className="space-y-1.5">
          <Label htmlFor="sucursal" className="text-xs">Sucursal</Label>
          <Select
            id="sucursal"
            name="sucursal"
            defaultValue={defaultValues.sucursal ?? ""}
          >
            <option value="">Todas</option>
            {SUCURSALES.map((s) => (
              <option key={s} value={s}>
                {SUCURSAL_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {productos && (
        <div className="space-y-1.5">
          <Label htmlFor="productoId" className="text-xs">Modelo</Label>
          <Select
            id="productoId"
            name="productoId"
            defaultValue={defaultValues.productoId ?? ""}
          >
            <option value="">Todos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>
      )}

      {mostrarTipo && (
        <div className="space-y-1.5">
          <Label htmlFor="tipo" className="text-xs">Tipo</Label>
          <Select
            id="tipo"
            name="tipo"
            defaultValue={defaultValues.tipo ?? ""}
          >
            <option value="">Todos</option>
            <option value="INGRESO">Ingresos</option>
            <option value="VENTA">Ventas</option>
            <option value="BAJA">Bajas</option>
            <option value="TRANSFERENCIA">Transferencias</option>
            <option value="LIQUIDACION">Liquidaciones</option>
          </Select>
        </div>
      )}

      <div className="flex items-end gap-2 md:col-span-5">
        <Button type="submit" size="sm">
          Aplicar filtros
        </Button>
        <Button asChild type="button" variant="ghost" size="sm">
          <Link href={action}>Limpiar</Link>
        </Button>
      </div>
    </form>
  );
}
