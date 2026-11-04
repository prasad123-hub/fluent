import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/shell/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const sp = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center grid-dots px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>
        <div className="rounded-lg border border-border bg-background-200 p-6 shadow-card">
          <h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-secondary">Log in to your personal coach.</p>
          <LoginForm error={sp.error} code={sp.code} callbackUrl={sp.callbackUrl} />
        </div>
        <p className="mt-6 text-center text-xs text-tertiary">
          Single-owner app. Credentials are set in the server environment.
        </p>
      </div>
    </main>
  );
}
