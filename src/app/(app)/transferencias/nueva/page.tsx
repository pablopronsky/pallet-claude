import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { getStockActual } from "@/server/queries/stock";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TransferenciaForm,
  type StockDisponible,
} from "@/components/transferencias/transferencia-form";

export default async function NuevaTransferenciaPage() {
  const session = await auth();
  if (session?.user.rol !== "ADMIN") redirect("/dashboard");

  const stock = await getStockActual();
  const disponibles: StockDisponible[] = stock
    .filter((r) => r.stock > 0)
    .map((r) => ({
      productoId: r.productoId,
      productoNombre: r.productoNombre,
      sucursal: r.sucursal,
      stock: r.stock,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/transferencias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva transferencia entre sucursales</CardTitle>
          <CardDescription>
            Las cajas se descuentan del origen siguiendo FIFO y se reciben en
            el destino con el mismo costo y moneda originales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransferenciaForm disponibles={disponibles} />
        </CardContent>
      </Card>
    </div>
  );
}
