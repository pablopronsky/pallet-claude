import { PrismaClient, Rol, Sucursal } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Slots fijos de usuario: uno por rol+sucursal. Si el slot ya tiene un
// usuario real cargado, el seed NO lo toca (ni nombre, ni email, ni
// password). Solo crea los slots vacíos con un default razonable.
const DEFAULTS = [
  {
    nombre: "Administrador NP",
    email: "admin@np.com",
    passwordPlano: "admin123",
    rol: Rol.ADMIN,
    sucursal: null as Sucursal | null,
  },
  {
    nombre: "Vendedor Quilmes",
    email: "quilmes@np.com",
    passwordPlano: "vend123",
    rol: Rol.VENDEDOR,
    sucursal: Sucursal.QUILMES,
  },
  {
    nombre: "Vendedor La Plata",
    email: "laplata@np.com",
    passwordPlano: "vend123",
    rol: Rol.VENDEDOR,
    sucursal: Sucursal.LA_PLATA,
  },
  {
    nombre: "Vendedor Gonnet",
    email: "gonnet@np.com",
    passwordPlano: "vend123",
    rol: Rol.VENDEDOR,
    sucursal: Sucursal.GONNET,
  },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  for (const u of DEFAULTS) {
    const existente = await prisma.user.findFirst({
      where: { rol: u.rol, sucursal: u.sucursal },
    });

    if (existente) {
      console.log(
        `  ↺ Slot ${u.rol}/${u.sucursal ?? "—"} ya ocupado por ${existente.nombre} (${existente.email}) — sin cambios`,
      );
      continue;
    }

    const hash = await bcrypt.hash(u.passwordPlano, 10);
    await prisma.user.create({
      data: {
        nombre: u.nombre,
        email: u.email,
        password: hash,
        rol: u.rol,
        sucursal: u.sucursal,
      },
    });
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
