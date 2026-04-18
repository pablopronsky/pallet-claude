"use client";

import { useActionState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { editarUsuarioAction } from "@/server/actions/usuarios";
import type { ActionState } from "@/server/actions/usuarios";

const ESTADO_INICIAL: ActionState = { ok: false };

type Usuario = {
  id: string;
  nombre: string;
  email: string;
};

export function EditarUsuarioForm({ usuario }: { usuario: Usuario }) {
  const [state, formAction] = useActionState(
    editarUsuarioAction,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (state.ok) {
      // Reset de campo contraseña después de guardar con éxito.
      const input = document.getElementById(
        `password-${usuario.id}`,
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    }
  }, [state.ok, usuario.id]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={usuario.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`nombre-${usuario.id}`}>Nombre</Label>
          <Input
            id={`nombre-${usuario.id}`}
            name="nombre"
            defaultValue={usuario.nombre}
            required
          />
          {state.fieldErrors?.nombre?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.nombre[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`email-${usuario.id}`}>Email</Label>
          <Input
            id={`email-${usuario.id}`}
            name="email"
            type="email"
            defaultValue={usuario.email}
            required
          />
          {state.fieldErrors?.email?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor={`password-${usuario.id}`}>
            Nueva contraseña{" "}
            <span className="text-xs text-muted-foreground">
              (dejar vacío para mantener la actual)
            </span>
          </Label>
          <Input
            id={`password-${usuario.id}`}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
          />
          {state.fieldErrors?.password?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo guardar</AlertTitle>
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

      <div>
        <SubmitButton labelDefault="Guardar cambios" size="sm" />
      </div>
    </form>
  );
}
