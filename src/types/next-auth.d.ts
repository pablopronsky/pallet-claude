import type { Rol, Sucursal } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
      sucursal: Sucursal | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    rol: Rol;
    sucursal: Sucursal | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
    sucursal: Sucursal | null;
  }
}
