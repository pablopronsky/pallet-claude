import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IngresoForm } from "@/components/ingresos/ingreso-form";

export default async function NuevoIngresoPage() {
  const session = await auth();
  if (session?.user.rol !== "ADMIN") redirect("/dashboard");

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/ingresos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo ingreso de mercadería</CardTitle>
          <CardDescription>
            Registrá cajas recibidas en consignación. El stock se actualiza al
            instante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productos.length === 0 ? (
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              No hay modelos de piso cargados.{" "}
              <Link href="/productos" className="underline">
                Crear uno primero
              </Link>
              .
            </div>
          ) : (
            <IngresoForm productos={productos} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
