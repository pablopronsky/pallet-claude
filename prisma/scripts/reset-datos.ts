/**
 * Borra todos los datos operativos manteniendo usuarios y productos.
 * Uso: npx tsx prisma/scripts/reset-datos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Borrando datos operativos...");

  // Orden importante: primero los que referencian a otros
  const [liquidaciones, transferencias, ventas, bajas, ingresos] =
    await prisma.$transaction([
      prisma.liquidacion.deleteMany(),
      prisma.transferencia.deleteMany(),
      prisma.venta.deleteMany(),
      prisma.baja.deleteMany(),
      prisma.ingreso.deleteMany(),
    ]);

  console.log(`Liquidaciones borradas: ${liquidaciones.count}`);
  console.log(`Transferencias borradas: ${transferencias.count}`);
  console.log(`Ventas borradas:         ${ventas.count}`);
  console.log(`Bajas borradas:          ${bajas.count}`);
  console.log(`Ingresos borrados:       ${ingresos.count}`);
  console.log("\nListo. Usuarios y productos intactos.");
  console.log("Nota: el caché de la app expira en hasta 60 segundos. Recargá la página si ves datos viejos.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
