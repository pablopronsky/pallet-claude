import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NuevoProductoForm,
  EditarProductoRow,
} from "@/components/productos/producto-form";
import { formatFecha } from "@/lib/format";

export default async function ProductosPage() {
  const session = await auth();
  const rol = session?.user.rol;
  if (rol !== "ADMIN" && rol !== "LOGISTICA") redirect("/dashboard");

  const productos = await prisma.producto.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
          Catálogo
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Modelos
        </h1>
        <p className="text-sm text-muted-foreground">
          Alta y gestión de los modelos que se reciben en consignación.
        </p>
      </div>

      {rol === "ADMIN" && <NuevoProductoForm />}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Productos cargados</CardTitle>
          <CardDescription>
            Marcá como inactivo para que deje de aparecer en nuevos ingresos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Stock mín.</TableHead>
                <TableHead>Alta</TableHead>
                {rol === "ADMIN" && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={p.activo ? "success" : "secondary"}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular">
                    {p.stockMinimo}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFecha(p.createdAt)}
                  </TableCell>
                  {rol === "ADMIN" && (
                    <TableCell>
                      <div className="flex justify-end">
                        <EditarProductoRow
                          producto={{
                            id: p.id,
                            nombre: p.nombre,
                            activo: p.activo,
                            stockMinimo: p.stockMinimo,
                          }}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {productos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Todavía no hay productos cargados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
