"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { crearUsuarioLogisticaAction } from "@/server/actions/usuarios";
import type { ActionState } from "@/server/actions/usuarios";

const ESTADO_INICIAL: ActionState = { ok: false };

export function CrearUsuarioLogisticaForm() {
  const [state, formAction] = useActionState(
    crearUsuarioLogisticaAction,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-nombre">Nombre</Label>
          <Input id="nuevo-nombre" name="nombre" required />
          {state.fieldErrors?.nombre?.[0] && (
            <p className="text-xs text-destructive">{state.fieldErrors.nombre[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nuevo-email">Email</Label>
          <Input id="nuevo-email" name="email" type="email" required />
          {state.fieldErrors?.email?.[0] && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="nuevo-password">Contraseña</Label>
          <Input
            id="nuevo-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            required
          />
          {state.fieldErrors?.password?.[0] && (
            <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo crear</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.ok && state.mensaje && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Listo</AlertTitle>
          <AlertDescription>{state.mensaje}</AlertDescription>
        </Alert>
      )}

      <SubmitButton labelDefault="Crear usuario" size="sm" />
    </form>
  );
}
