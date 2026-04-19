"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import {
  crearProductoAction,
  editarProductoAction,
} from "@/server/actions/productos";
import type { ActionState } from "@/server/actions/usuarios";

const ESTADO_INICIAL: ActionState = { ok: false };

export function NuevoProductoForm() {
  const [state, formAction] = useActionState(
    crearProductoAction,
    ESTADO_INICIAL,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="nombre-nuevo">Nuevo modelo de piso</Label>
        <Input
          id="nombre-nuevo"
          name="nombre"
          placeholder="Ej: Roble Ahumado"
          required
        />
        {state.fieldErrors?.nombre?.[0] && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.nombre[0]}
          </p>
        )}
      </div>
      <div className="space-y-1.5 md:w-48">
        <Label htmlFor="stockMinimo-nuevo">Stock mínimo (cajas)</Label>
        <Input
          id="stockMinimo-nuevo"
          name="stockMinimo"
          type="number"
          min="0"
          step="1"
          defaultValue="0"
        />
        {state.fieldErrors?.stockMinimo?.[0] && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.stockMinimo[0]}
          </p>
        )}
      </div>
      <SubmitButton labelDefault="Agregar" labelPending="Creando...">
        <Plus className="mr-2 h-4 w-4" />
        Agregar
      </SubmitButton>
      {state.error && (
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.ok && state.mensaje && (
        <p className="w-full text-xs text-emerald-700">{state.mensaje}</p>
      )}
    </form>
  );
}

type Producto = {
  id: string;
  nombre: string;
  activo: boolean;
  stockMinimo: number;
};

export function EditarProductoRow({ producto }: { producto: Producto }) {
  const [state, formAction] = useActionState(
    editarProductoAction,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={producto.id} />
      <Input
        name="nombre"
        defaultValue={producto.nombre}
        required
        className="w-56"
      />
      <Input
        name="stockMinimo"
        type="number"
        min="0"
        step="1"
        defaultValue={producto.stockMinimo}
        className="w-24"
        title="Stock mínimo (cajas)"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="activo"
          value="true"
          defaultChecked={producto.activo}
          className="h-4 w-4"
        />
        Activo
      </label>
      <SubmitButton
        labelDefault="Guardar"
        labelPending="..."
        size="sm"
        variant="outline"
      />

      {state.error && (
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.ok && state.mensaje && (
        <Alert variant="success" className="w-full">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{state.mensaje}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
