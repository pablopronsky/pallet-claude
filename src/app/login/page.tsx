import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[60fr_40fr]"
      style={{ background: "var(--np-ink)" }}
    >
      {/* Hero 60% */}
      <aside
        className="relative hidden overflow-hidden lg:block"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% 20%, rgba(0,103,48,0.45) 0%, transparent 60%)," +
              "radial-gradient(900px 500px at 90% 90%, rgba(239,127,26,0.28) 0%, transparent 55%)," +
              "linear-gradient(180deg, #121417 0%, #0d0f12 100%)",
          }}
        />
        {/* Patrón sutil de tablones */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 140px)," +
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0 1px, transparent 1px 22px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-md text-sm font-bold text-white"
              style={{ background: "var(--np-green)" }}
            >
              NP
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight">Nuevo Parket</p>
              <p className="text-xs text-muted-foreground">Control de consignación</p>
            </div>
          </div>

          <div className="max-w-lg space-y-4">
            <p className="np-kicker" style={{ color: "var(--np-orange)" }}>
              All Covering SRL · Nuevo Parket
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
              Stock, ventas y deuda.<br />Un solo tablero.
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestioná la mercadería en consignación entre Quilmes, La Plata y
              Gonnet con trazabilidad FIFO y reportes listos para exportar.
            </p>
          </div>
        </div>
      </aside>

      {/* Panel 40% */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <p className="np-kicker mb-2" style={{ color: "var(--np-orange)" }}>
            Acceso privado
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usá la cuenta asignada a tu sucursal.
          </p>

          <div className="mt-8">
            <LoginForm callbackUrl={safeCallback} />
          </div>

          <div
            className="mt-8 rounded-lg border p-4 text-xs"
            style={{ borderColor: "var(--np-line)", background: "var(--np-panel)" }}
          >
            <p className="np-kicker mb-2">Cuentas de ejemplo</p>
            <ul className="space-y-0.5 text-muted-foreground tabular">
              <li>admin@np.com · admin123</li>
              <li>quilmes@np.com · vend123</li>
              <li>laplata@np.com · vend123</li>
              <li>gonnet@np.com · vend123</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
