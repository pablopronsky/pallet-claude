import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Buscar todos los ingresos de QUILMES con 60 cajas para encontrar el correcto
  const ingresos = await prisma.ingreso.findMany({
    where: {
      sucursal: "QUILMES",
      cantidadCajas: 60,
      origen: "PROVEEDOR",
    },
    include: { producto: { select: { nombre: true } } },
    orderBy: { fecha: "desc" },
  });

  if (ingresos.length === 0) {
    console.error("No se encontró ningún ingreso en QUILMES con 60 cajas.");
    return;
  }

  console.log("Ingresos encontrados:");
  ingresos.forEach((i, idx) =>
    console.log(`  [${idx}] ${i.fecha.toISOString()} | ${i.producto.nombre} | $${i.precioCostoPorCaja} | id: ${i.id}`)
  );

  // Tomamos el primero que matchea por nombre y precio
  const ingreso = ingresos.find(
    (i) => i.producto.nombre.toLowerCase().includes("atlas") && Number(i.precioCostoPorCaja) < 15
  );

  if (!ingreso) {
    console.log("No se pudo identificar automáticamente. Revisá la lista de arriba y actualizá el id manualmente.");
    return;
  }

  console.log(`\nActualizando: ${ingreso.producto.nombre} | $${ingreso.precioCostoPorCaja} → $19.96`);

  const actualizado = await prisma.ingreso.update({
    where: { id: ingreso.id },
    data: { precioCostoPorCaja: 19.96 },
  });

  console.log(`Listo. Nuevo precio: $${actualizado.precioCostoPorCaja}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
