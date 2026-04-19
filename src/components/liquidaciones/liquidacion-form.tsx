"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { MonedaInput } from "@/components/moneda-input";
import { fechaParaInput } from "@/lib/format";
import { crearLiquidacionAction } from "@/server/actions/liquidaciones";
import type { ActionState } from "@/server/actions/usuarios";

const ESTADO_INICIAL: ActionState = { ok: false };

export function LiquidacionForm() {
  const [state, formAction] = useActionState(
    crearLiquidacionAction,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <MonedaInput
          precioLabel="Monto"
          precioName="monto"
          monedaName="moneda"
          tipoCambioName="tipoCambio"
          precioStep="0.01"
          precioError={state.fieldErrors?.monto?.[0]}
          tipoCambioError={state.fieldErrors?.tipoCambio?.[0]}
        />

        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha del pago</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={fechaParaInput(new Date())}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comprobante">Comprobante (opcional)</Label>
          <Input
            id="comprobante"
            name="comprobante"
            placeholder="Nº de transferencia, recibo, etc."
            maxLength={120}
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
          <AlertTitle>No se pudo registrar la liquidación</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <SubmitButton
          labelDefault="Registrar liquidación"
          labelPending="Guardando..."
        />
      </div>
    </form>
  );
}
