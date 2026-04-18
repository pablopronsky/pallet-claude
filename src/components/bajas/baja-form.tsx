"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

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
import {
  MOTIVO_LABEL,
  SUCURSAL_LABEL,
  SUCURSALES,
} from "@/lib/constants";
import { fechaParaInput } from "@/lib/format";
import { crearBajaAction } from "@/server/actions/bajas";
import type { ActionState } from "@/server/actions/usuarios";
import { Motivo } from "@prisma/client";

const ESTADO_INICIAL: ActionState = { ok: false };

type Producto = { id: string; nombre: string };

export function BajaForm({ productos }: { productos: Producto[] }) {
  const [state, formAction] = useActionState(crearBajaAction, ESTADO_INICIAL);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="productoId">Modelo de piso</Label>
          <Select id="productoId" name="productoId" required defaultValue="">
            <option value="" disabled>
              Elegí un modelo…
            </option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.productoId?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.productoId[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sucursal">Sucursal</Label>
          <Select id="sucursal" name="sucursal" required defaultValue="">
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
          <Label htmlFor="motivo">Motivo</Label>
          <Select id="motivo" name="motivo" required defaultValue="">
            <option value="" disabled>
              Elegí un motivo…
            </option>
            {Object.values(Motivo).map((m) => (
              <option key={m} value={m}>
                {MOTIVO_LABEL[m]}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.motivo?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.motivo[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha de la baja</Label>
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
          <AlertTitle>No se pudo registrar la baja</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <SubmitButton labelDefault="Registrar baja" labelPending="Guardando..." />
      </div>
    </form>
  );
}
