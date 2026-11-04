import {
  BookOpen,
  Briefcase,
  Coffee,
  GraduationCap,
  Handshake,
  MessageCircle,
  Plane,
  Presentation,
  Sparkles,
  UserCheck,
  Users,
  Volume2,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Lucide icons referenced by name from the seeded Theme rows. */
const ICONS: Record<string, LucideIcon> = {
  Coffee,
  Briefcase,
  UserCheck,
  Presentation,
  Users,
  Handshake,
  Plane,
  GraduationCap,
  Sparkles,
  BookOpen,
  Volume2,
  Zap,
  MessageCircle,
  Wand2,
};

export function ThemeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? MessageCircle;
  return <Icon className={cn("size-4", className)} strokeWidth={1.5} aria-hidden />;
}
