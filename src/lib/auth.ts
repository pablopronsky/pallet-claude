import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const usuario = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!usuario) return null;

        const ok = await bcrypt.compare(password, usuario.password);
        if (!ok) return null;

        // Invariante: vendedor siempre tiene sucursal asignada
        if (usuario.rol === "VENDEDOR" && !usuario.sucursal) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          sucursal: usuario.sucursal,
        };
      },
    }),
  ],
});
