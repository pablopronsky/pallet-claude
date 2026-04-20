"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/schemas/auth";

export type LoginState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Revisá los datos ingresados.",
    };
  }

  const rawCallbackUrl = String(formData.get("callbackUrl") ?? "");
  const callbackUrl =
    rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
    return { ok: true };
  } catch (err) {
    // Next redirige internamente con una excepción especial; hay que re-lanzarla.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "Email o contraseña incorrectos." };
      }
      return { ok: false, error: "No se pudo iniciar sesión. Intentá de nuevo." };
    }
    throw err;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
