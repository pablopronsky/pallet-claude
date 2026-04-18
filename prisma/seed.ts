import { PrismaClient, Rol, Sucursal } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const vendHash = await bcrypt.hash("vend123", 10);

  // 4 slots fijos de usuario — nombres reales del equipo Nuevo Parket.
  const usuarios = [
    {
      nombre: "Ariel Pérez",
      email: "admin@np.com",
      password: adminHash,
      rol: Rol.ADMIN,
      sucursal: null,
    },
    {
      nombre: "Carla Gómez",
      email: "quilmes@np.com",
      password: vendHash,
      rol: Rol.VENDEDOR,
      sucursal: Sucursal.QUILMES,
    },
    {
      nombre: "Diego Ríos",
      email: "laplata@np.com",
      password: vendHash,
      rol: Rol.VENDEDOR,
      sucursal: Sucursal.LA_PLATA,
    },
    {
      nombre: "Lucía Méndez",
      email: "gonnet@np.com",
      password: vendHash,
      rol: Rol.VENDEDOR,
      sucursal: Sucursal.GONNET,
    },
  ];

  for (const u of usuarios) {
    const existente = await prisma.user.findUnique({ where: { email: u.email } });
    if (existente) {
      // Actualizamos nombre por si cambió entre seeds, manteniendo password.
      if (existente.nombre !== u.nombre) {
        await prisma.user.update({
          where: { email: u.email },
          data: { nombre: u.nombre },
        });
        console.log(`  ↻ Renombrado ${u.email} → ${u.nombre}`);
      } else {
        console.log(`  ↺ Usuario ya existe: ${u.email}`);
      }
      continue;
    }
    await prisma.user.create({ data: u });
    console.log(`  ✓ Creado ${u.rol}: ${u.email} (${u.nombre})`);
  }

  // Modelos reales del catálogo Floorpan / Valvi / SPC.
  const productos = [
    "Floorpan Fix - Karayael",
    "Floorpan Fix - Budgay",
    "Floorpan Classic - Dogal",
    "Floorpan Classic - Atlas",
    "Valvi Green Chakra",
    "Valvi SPC JC002-4A",
    "SPC Oferta",
  ];

  for (const nombre of productos) {
    const existente = await prisma.producto.findUnique({ where: { nombre } });
    if (existente) {
      console.log(`  ↺ Producto ya existe: ${nombre}`);
      continue;
    }
    await prisma.producto.create({ data: { nombre } });
    console.log(`  ✓ Creado producto: ${nombre}`);
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
