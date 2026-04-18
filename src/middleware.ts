import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

// Middleware edge-safe: solo usa `authConfig`, no importa Prisma ni bcrypt.
// El callback `authorized` de authConfig protege todas las rutas no públicas.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // La lógica de autorización vive en `authConfig.callbacks.authorized`.
  // Este wrapper existe para que el middleware se ejecute sobre el matcher.
  return;
});

export const config = {
  // Protege todo menos los assets y las rutas internas de NextAuth.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
