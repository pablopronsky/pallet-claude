import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

// Proxy edge-safe (Next 16): solo usa `authConfig`, no importa Prisma ni
// bcrypt. El callback `authorized` de authConfig protege todas las rutas no
// públicas. Reemplaza al antiguo `middleware.ts` deprecado en Next 16.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy(() => {
  // La lógica de autorización vive en `authConfig.callbacks.authorized`.
  // Este wrapper existe para que el proxy se ejecute sobre el matcher.
  return;
});

export const config = {
  // Protege todo menos los assets y las rutas internas de NextAuth.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
