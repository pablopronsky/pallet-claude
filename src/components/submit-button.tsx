"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type Props = ButtonProps & {
  labelDefault?: string;
  labelPending?: string;
};

export function SubmitButton({
  labelDefault = "Guardar",
  labelPending = "Guardando...",
  children,
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {labelPending}
        </>
      ) : (
        (children ?? labelDefault)
      )}
    </Button>
  );
}
