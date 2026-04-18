import type { NextAuthConfig } from "next-auth";

/**
 * Configuración base de NextAuth compatible con el Edge Runtime.
 *
 * Esta mitad no puede importar Prisma ni bcrypt (ambos usan APIs de Node que
 * no están disponibles en el middleware). La validación real de credenciales
 * se hace en `auth.ts`, que sí corre en Node.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Cualquier otra ruta (que no sea pública) requiere sesión.
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
        return Response.redirect(loginUrl);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.sucursal = user.sucursal ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as typeof session.user.rol;
        session.user.sucursal = token.sucursal as typeof session.user.sucursal;
      }
      return session;
    },
  },
  providers: [], // los providers reales se agregan en auth.ts (runtime Node)
};
