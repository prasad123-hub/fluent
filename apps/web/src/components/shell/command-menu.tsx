"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  BookOpen,
  Compass,
  Flame,
  LayoutDashboard,
  ListChecks,
  Mic,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Target,
  Volume2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandMenuContextValue {
  open: boolean;
  setOpen: (o: boolean) => void;
}
const Ctx = React.createContext<CommandMenuContextValue>({ open: false, setOpen: () => {} });
export const useCommandMenu = () => React.useContext(Ctx);

export interface ScenarioQuickItem {
  id: string;
  title: string;
  theme: string;
}

export function CommandMenuProvider({
  children,
  scenarios = [],
}: {
  children: React.ReactNode;
  scenarios?: ScenarioQuickItem[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const nav = [
    { label: "Practice now", href: "/practice", icon: Mic, shortcut: "P" },
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Progress", href: "/dashboard/progress", icon: BarChart3 },
    { label: "Sessions", href: "/dashboard/sessions", icon: ListChecks },
    { label: "Mistakes", href: "/dashboard/mistakes", icon: Sparkles },
    { label: "Vocabulary", href: "/dashboard/vocabulary", icon: BookOpen },
    { label: "Pronunciation", href: "/dashboard/pronunciation", icon: Volume2 },
    { label: "Goals", href: "/dashboard/goals", icon: Target },
    { label: "Scenario library", href: "/scenarios", icon: Compass },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, scenarios, actions…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Go to">
            {nav.map((n) => (
              <CommandItem key={n.href} value={n.label} onSelect={() => go(n.href)}>
                <n.icon />
                {n.label}
                {n.shortcut ? <CommandShortcut>{n.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
          {scenarios.length ? (
            <CommandGroup heading="Start a scenario">
              {scenarios.slice(0, 40).map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.title} ${s.theme}`}
                  onSelect={() => go(`/practice?scenario=${s.id}`)}
                >
                  <Flame />
                  <span className="truncate">{s.title}</span>
                  <CommandShortcut>{s.theme}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Preferences">
            <CommandItem
              value="toggle theme dark light"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </Ctx.Provider>
  );
}
