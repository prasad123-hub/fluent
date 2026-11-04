"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Search, Settings, Slash } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommandMenu } from "./command-menu";
import { cn } from "@/lib/utils";

const CRUMBS: Array<{ match: RegExp; label: string; href?: string }> = [
  { match: /^\/dashboard/, label: "Dashboard", href: "/dashboard" },
  { match: /^\/practice/, label: "Practice", href: "/practice" },
  { match: /^\/scenarios/, label: "Scenarios", href: "/scenarios" },
  { match: /^\/sessions\//, label: "Session report" },
  { match: /^\/admin/, label: "Admin", href: "/admin/health" },
  { match: /^\/design/, label: "Design system" },
];

export function Navbar({
  userName,
  onSignOut,
  className,
}: {
  userName: string;
  onSignOut?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { setOpen } = useCommandMenu();
  const crumb = CRUMBS.find((c) => c.match.test(pathname));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background-100/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
        <Logo withWordmark={false} />
        <Slash className="size-4 -rotate-12 text-gray-500" strokeWidth={1.5} />
        <Link
          href="/dashboard"
          className="text-sm font-medium text-foreground hover:text-foreground"
        >
          {userName}
        </Link>
        {crumb ? (
          <>
            <ChevronRight className="size-3.5 text-tertiary" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-sm font-medium text-secondary hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-sm font-medium text-secondary">{crumb.label}</span>
            )}
          </>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="hidden w-48 justify-between pr-1.5 text-secondary sm:inline-flex"
            onClick={() => setOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5" />
              Search…
            </span>
            <Kbd>⌘K</Kbd>
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            className="sm:hidden"
            aria-label="Search"
            onClick={() => setOpen(true)}
          >
            <Search />
          </Button>
          <ThemeToggle className="hidden sm:inline-flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                aria-label="Account menu"
              >
                <Avatar name={userName} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-foreground">{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <div className="flex items-center justify-between px-2 py-1.5 text-sm sm:hidden">
                <span className="text-secondary">Theme</span>
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}>
                <LogOut /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
