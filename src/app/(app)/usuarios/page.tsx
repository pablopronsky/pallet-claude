import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROL_LABEL } from "@/lib/constants";
import { SucursalChip } from "@/components/sucursal-chip";
import { EditarUsuarioForm } from "@/components/usuarios/editar-usuario-form";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default async function UsuariosPage() {
  const session = await auth();
  if (session?.user.rol !== "ADMIN") redirect("/dashboard");

  const usuarios = await prisma.user.findMany({
    orderBy: [{ rol: "asc" }, { sucursal: "asc" }, { nombre: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
          Administración
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Usuarios
        </h1>
        <p className="text-sm text-muted-foreground">
          4 slots fijos: 1 administrador y 1 vendedor por sucursal. Solo se
          editan; no se crean ni se eliminan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {usuarios.map((u) => {
          const acento =
            u.rol === "ADMIN" ? "var(--np-green)" : "var(--np-orange)";
          return (
            <article key={u.id} className="np-card overflow-hidden">
              <header
                className="flex items-center gap-4 border-b p-5"
                style={{ borderColor: "var(--np-line)" }}
              >
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-base font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${acento} 0%, color-mix(in oklab, ${acento} 60%, black) 100%)`,
                  }}
                >
                  {initials(u.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-tight">
                    {u.nombre}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="np-chip"
                      style={{
                        background: `color-mix(in oklab, ${acento} 16%, transparent)`,
                        color: acento,
                      }}
                    >
                      {ROL_LABEL[u.rol]}
                    </span>
                    {u.sucursal && <SucursalChip sucursal={u.sucursal} />}
                  </div>
                </div>
              </header>
              <div className="p-5">
                <EditarUsuarioForm
                  usuario={{ id: u.id, nombre: u.nombre, email: u.email }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
