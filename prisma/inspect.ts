import { PrismaClient } from "@prisma/client";

// Utility para ver el estado de usuarios y su actividad. Útil para debuggear
// seeds, duplicados o slots vacíos. Ejecutar: `npx tsx prisma/inspect.ts`.
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      sucursal: true,
      _count: { select: { ingresos: true, ventas: true, bajas: true } },
    },
    orderBy: [{ rol: "asc" }, { sucursal: "asc" }, { createdAt: "asc" }],
  });
  console.log(JSON.stringify(users, null, 2));
  await p.$disconnect();
})();
