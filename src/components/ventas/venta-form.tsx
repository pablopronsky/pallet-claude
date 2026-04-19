"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Sucursal } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { MonedaInput } from "@/components/moneda-input";
import { SUCURSAL_LABEL, SUCURSALES } from "@/lib/constants";
import { fechaParaInput, formatCajas } from "@/lib/format";
import { crearVentaAction } from "@/server/actions/ventas";
import type { ActionState } from "@/server/actions/usuarios";

const ESTADO_INICIAL: ActionState = { ok: false };

// Fila de stock disponible para elegir producto con stock > 0.
export type FilaDisponible = {
  productoId: string;
  productoNombre: string;
  sucursal: Sucursal;
  stock: number;
};

type Props = {
  rolAdmin: boolean;
  sucursalVendedor: Sucursal | null;
  disponibles: FilaDisponible[]; // admin: todas las sucursales; vendedor: la suya
};

export function VentaForm({ rolAdmin, sucursalVendedor, disponibles }: Props) {
  const [state, formAction] = useActionState(
    crearVentaAction,
    ESTADO_INICIAL,
  );

  const [sucursal, setSucursal] = useState<Sucursal | "">(
    rolAdmin ? "" : (sucursalVendedor as Sucursal),
  );

  const productosPorSucursal = useMemo(() => {
    if (!sucursal) return [];
    return disponibles.filter((d) => d.sucursal === sucursal);
  }, [disponibles, sucursal]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {rolAdmin ? (
          <div className="space-y-1.5">
            <Label htmlFor="sucursal">Sucursal</Label>
            <Select
              id="sucursal"
              name="sucursal"
              required
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value as Sucursal | "")}
            >
              <option value="" disabled>
                Elegí sucursal…
              </option>
              {SUCURSALES.map((s) => (
                <option key={s} value={s}>
                  {SUCURSAL_LABEL[s]}
                </option>
              ))}
            </Select>
            {state.fieldErrors?.sucursal?.[0] && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.sucursal[0]}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Sucursal</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
              {sucursalVendedor ? SUCURSAL_LABEL[sucursalVendedor] : "—"}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="productoId">Modelo de piso</Label>
          <Select
            key={sucursal || "vacio"}
            id="productoId"
            name="productoId"
            required
            disabled={!sucursal}
            defaultValue=""
          >
            <option value="" disabled>
              {sucursal ? "Elegí un modelo…" : "Primero elegí sucursal"}
            </option>
            {productosPorSucursal.map((p) => (
              <option key={p.productoId} value={p.productoId}>
                {p.productoNombre} — {formatCajas(p.stock)} cajas disp.
              </option>
            ))}
          </Select>
          {productosPorSucursal.length === 0 && sucursal && (
            <p className="text-xs text-muted-foreground">
              No hay stock disponible en esta sucursal.
            </p>
          )}
          {state.fieldErrors?.productoId?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.productoId[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cantidadCajas">Cantidad de cajas</Label>
          <Input
            id="cantidadCajas"
            name="cantidadCajas"
            type="number"
            min="1"
            step="1"
            required
          />
          {state.fieldErrors?.cantidadCajas?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.cantidadCajas[0]}
            </p>
          )}
        </div>

        <MonedaInput
          precioLabel="Precio de venta por caja"
          precioName="precioVentaPorCaja"
          monedaName="moneda"
          tipoCambioName="tipoCambio"
          precioError={state.fieldErrors?.precioVentaPorCaja?.[0]}
          tipoCambioError={state.fieldErrors?.tipoCambio?.[0]}
        />

        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha de venta</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={fechaParaInput(new Date())}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea id="notas" name="notas" rows={2} />
        </div>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo registrar la venta</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <SubmitButton labelDefault="Registrar venta" labelPending="Guardando..." />
      </div>
    </form>
  );
}
