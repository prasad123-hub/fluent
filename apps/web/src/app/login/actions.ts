"use server";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/dashboard",
    });
    return {};
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof AuthError) {
      const code = (err as AuthError & { code?: string }).code;
      if (code === "rate_limited")
        return { error: "Too many attempts. Please wait 15 minutes and try again." };
      return { error: "That email and password don't match." };
    }
    throw err;
  }
}
