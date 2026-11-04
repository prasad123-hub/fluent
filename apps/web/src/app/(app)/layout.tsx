import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { AppShellClient } from "./app-shell-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwnerPage();
  const scenarios = await prisma.scenario.findMany({
    select: { id: true, title: true, theme: { select: { title: true } } },
    orderBy: { order: "asc" },
  });
  return (
    <AppShellClient
      userName={owner.name}
      scenarios={scenarios.map((s) => ({ id: s.id, title: s.title, theme: s.theme.title }))}
    >
      {children}
    </AppShellClient>
  );
}
