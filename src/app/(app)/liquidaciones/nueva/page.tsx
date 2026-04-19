import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiquidacionForm } from "@/components/liquidaciones/liquidacion-form";
import { PROVEEDOR_NOMBRE } from "@/lib/constants";

export default async function NuevaLiquidacionPage() {
  const session = await auth();
  if (session?.user.rol !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/liquidaciones">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva liquidación a {PROVEEDOR_NOMBRE}</CardTitle>
          <CardDescription>
            Registrá un pago al proveedor. Si pagás en USD indicá el TC del día
            para convertirlo a ARS y descontarlo del saldo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LiquidacionForm />
        </CardContent>
      </Card>
    </div>
  );
}
