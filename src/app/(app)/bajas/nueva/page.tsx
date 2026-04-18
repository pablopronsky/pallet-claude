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
import { BajaForm } from "@/components/bajas/baja-form";

export default async function NuevaBajaPage() {
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
          <Link href="/bajas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva baja de stock</CardTitle>
          <CardDescription>
            Retira cajas del stock por motivos administrativos. No genera deuda
            con el proveedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BajaForm productos={productos} />
        </CardContent>
      </Card>
    </div>
  );
}
