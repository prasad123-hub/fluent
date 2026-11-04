"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MESSAGES: Record<string, string> = {
  rate_limited: "Too many attempts. Please wait 15 minutes and try again.",
  bad_credentials: "That email and password don't match.",
};

export function LoginForm({
  error,
  code,
  callbackUrl,
}: {
  error?: string;
  code?: string;
  callbackUrl?: string;
}) {
  const initial: LoginState = {
    error: error ? (MESSAGES[code ?? ""] ?? "Login failed. Please try again.") : undefined,
  };
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, initial);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@example.com"
          invalid={!!state.error}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          invalid={!!state.error}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" loading={pending}>
        Log in
      </Button>
    </form>
  );
}
