"use client";
import { usePathname } from "next/navigation";
import { AppShell, DASHBOARD_TABS } from "@/components/shell/app-shell";
import type { ScenarioQuickItem } from "@/components/shell/command-menu";

export function AppShellClient({
  children,
  userName,
  scenarios,
}: {
  children: React.ReactNode;
  userName: string;
  scenarios: ScenarioQuickItem[];
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isLivePractice = /^\/practice\/[^/]+$/.test(pathname);
  if (isLivePractice) return <>{children}</>; // focus mode renders its own minimal bar
  const signOut = async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/login";
  };
  return (
    <AppShell
      userName={userName}
      tabs={isDashboard ? DASHBOARD_TABS : undefined}
      scenarios={scenarios}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}
