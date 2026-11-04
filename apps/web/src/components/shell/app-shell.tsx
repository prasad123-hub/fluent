"use client";
import { Navbar } from "./navbar";
import { TabBar, type TabItem } from "./tab-bar";
import { CommandMenuProvider, type ScenarioQuickItem } from "./command-menu";

export const DASHBOARD_TABS: TabItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/sessions", label: "Sessions" },
  { href: "/dashboard/mistakes", label: "Mistakes" },
  { href: "/dashboard/vocabulary", label: "Vocabulary" },
  { href: "/dashboard/pronunciation", label: "Pronunciation" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function AppShell({
  children,
  userName,
  tabs,
  scenarios,
  onSignOut,
}: {
  children: React.ReactNode;
  userName: string;
  tabs?: TabItem[];
  scenarios?: ScenarioQuickItem[];
  onSignOut?: () => void;
}) {
  return (
    <CommandMenuProvider scenarios={scenarios}>
      <div className="flex min-h-dvh flex-col">
        <Navbar userName={userName} onSignOut={onSignOut} />
        {tabs?.length ? (
          <div className="sticky top-14 z-30 bg-background-100/80 backdrop-blur-md">
            <div className="mx-auto max-w-screen-2xl px-2 sm:px-6">
              <TabBar items={tabs} />
            </div>
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-screen-2xl min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </CommandMenuProvider>
  );
}
