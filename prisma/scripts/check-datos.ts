import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [ventas, ingresos, transferencias, bajas, liquidaciones] = await Promise.all([
    prisma.venta.count(),
    prisma.ingreso.count(),
    prisma.transferencia.count(),
    prisma.baja.count(),
    prisma.liquidacion.count(),
  ]);

  console.log("Estado de la base de datos:");
  console.log(`  Ventas:          ${ventas}`);
  console.log(`  Ingresos:        ${ingresos}`);
  console.log(`  Transferencias:  ${transferencias}`);
  console.log(`  Bajas:           ${bajas}`);
  console.log(`  Liquidaciones:   ${liquidaciones}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
