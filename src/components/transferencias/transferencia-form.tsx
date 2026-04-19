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
import { SUCURSAL_LABEL, SUCURSALES } from "@/lib/constants";
import { fechaParaInput, formatCajas } from "@/lib/format";
import { crearTransferenciaAction } from "@/server/actions/transferencias";
import type { ActionState } from "@/server/actions/usuarios";

const ESTADO_INICIAL: ActionState = { ok: false };

export type StockDisponible = {
  productoId: string;
  productoNombre: string;
  sucursal: Sucursal;
  stock: number;
};

type Props = {
  disponibles: StockDisponible[];
};

export function TransferenciaForm({ disponibles }: Props) {
  const [state, formAction] = useActionState(
    crearTransferenciaAction,
    ESTADO_INICIAL,
  );

  const [origen, setOrigen] = useState<Sucursal | "">("");
  const [destino, setDestino] = useState<Sucursal | "">("");

  const productosOrigen = useMemo(() => {
    if (!origen) return [];
    return disponibles.filter((d) => d.sucursal === origen && d.stock > 0);
  }, [disponibles, origen]);

  const sucursalesDestino = SUCURSALES.filter((s) => s !== origen);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sucursalOrigen">Sucursal origen</Label>
          <Select
            id="sucursalOrigen"
            name="sucursalOrigen"
            required
            value={origen}
            onChange={(e) => {
              const v = e.target.value as Sucursal | "";
              setOrigen(v);
              if (v && v === destino) setDestino("");
            }}
          >
            <option value="" disabled>
              Elegí origen…
            </option>
            {SUCURSALES.map((s) => (
              <option key={s} value={s}>
                {SUCURSAL_LABEL[s]}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.sucursalOrigen?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.sucursalOrigen[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sucursalDestino">Sucursal destino</Label>
          <Select
            id="sucursalDestino"
            name="sucursalDestino"
            required
            value={destino}
            disabled={!origen}
            onChange={(e) => setDestino(e.target.value as Sucursal | "")}
          >
            <option value="" disabled>
              {origen ? "Elegí destino…" : "Primero elegí origen"}
            </option>
            {sucursalesDestino.map((s) => (
              <option key={s} value={s}>
                {SUCURSAL_LABEL[s]}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.sucursalDestino?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.sucursalDestino[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="productoId">Modelo de piso</Label>
          <Select
            key={origen || "vacio"}
            id="productoId"
            name="productoId"
            required
            disabled={!origen}
            defaultValue=""
          >
            <option value="" disabled>
              {origen ? "Elegí un modelo…" : "Primero elegí origen"}
            </option>
            {productosOrigen.map((p) => (
              <option key={p.productoId} value={p.productoId}>
                {p.productoNombre} — {formatCajas(p.stock)} cajas disp.
              </option>
            ))}
          </Select>
          {productosOrigen.length === 0 && origen && (
            <p className="text-xs text-muted-foreground">
              No hay stock en esta sucursal para transferir.
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

        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={fechaParaInput(new Date())}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea
            id="notas"
            name="notas"
            rows={2}
            placeholder="Ej: nro de remito, transportista…"
          />
        </div>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo registrar la transferencia</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <SubmitButton
          labelDefault="Registrar transferencia"
          labelPending="Guardando..."
        />
      </div>
    </form>
  );
}
