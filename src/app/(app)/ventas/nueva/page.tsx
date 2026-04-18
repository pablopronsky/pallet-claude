import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { getDisponiblesParaVender, getStockActual } from "@/server/queries/stock";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  VentaForm,
  type FilaDisponible,
} from "@/components/ventas/venta-form";

export default async function NuevaVentaPage() {
  const session = await auth();
  const user = session!.user;

  let disponibles: FilaDisponible[] = [];
  if (user.rol === "VENDEDOR" && user.sucursal) {
    const rows = await getDisponiblesParaVender(user.sucursal);
    disponibles = rows.map((r) => ({
      productoId: r.productoId,
      productoNombre: r.productoNombre,
      sucursal: r.sucursal,
      stock: r.stock,
    }));
  } else {
    const rows = await getStockActual();
    disponibles = rows
      .filter((r) => r.stock > 0)
      .map((r) => ({
        productoId: r.productoId,
        productoNombre: r.productoNombre,
        sucursal: r.sucursal,
        stock: r.stock,
      }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/ventas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva venta</CardTitle>
          <CardDescription>
            La asignación al lote (ingreso) se hace por FIFO: las cajas más
            antiguas se descuentan primero. Así los precios de costo quedan
            trazados correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VentaForm
            rolAdmin={user.rol === "ADMIN"}
            sucursalVendedor={user.sucursal}
            disponibles={disponibles}
          />
        </CardContent>
      </Card>
    </div>
  );
}
