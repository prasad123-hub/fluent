# Design system — Vercel / Geist on shadcn-style primitives

## What was researched (2026-11-04)

- `vercel.com/geist` and `vercel.com/design/*` are **unreachable from the build sandbox** (network policy), so
  token values come from the spec (§13.2, which lists the Geist values) and the well-known Geist gray/blue/
  green/amber/red/teal/purple/pink 1–10 scales.
- An official React package `@vercel/geistcn` is referenced in Vercel's docs but is **not published on npm**
  (registry returned no versions). The community `@geist-ui/core` is not Vercel's. → We rebuilt the Geist look
  on Radix primitives (`radix-ui` unified package) + Tailwind v4 tokens, shadcn-style, in `apps/web/src/components/ui`.
- Fonts: `geist` 1.9.1 → `GeistSans` (`--font-geist-sans`) and `GeistMono` (`--font-geist-mono`) via `next/font/local`.

## Tokens (`apps/web/src/app/globals.css`)

- CSS variables `--ds-*` for light (`:root`) and dark (`.dark`), mapped into Tailwind through `@theme inline`
  (`bg-background-100`, `text-secondary`, `border-border`, `bg-blue-700`, `text-green-900`, …).
- Dark is the default: `<html class="dark">` on first load; `next-themes` (`attribute="class"`) persists the choice.
- Backgrounds dark `#000 / #0a0a0a / #111 / hover #1a1a1a`; light `#fff / #fafafa / #f5f5f5`.
- Borders are hairlines (`#2e2e2e`/`#333` dark, `#eaeaea`/`#e5e5e5` light). Shadows only on floating elements
  (`shadow-menu`). Radius 6px inputs/buttons, 8–12px cards, full for pills. 4px grid.
- Type scale 12/13/14/16/20/24/32/48/64 with `tracking-tight` on headings. Mono for numbers, ids, timestamps.
- Focus: 2px offset blue ring (`:focus-visible`). Transitions 150–200ms `ease-ds`.
- Utilities: `hairline`, `skeleton` (shimmer), `grid-dots`, `gradient-text`, `glow-frame`, `tabular`.

## Components (`apps/web/src/components/ui`)

button (primary / secondary / tertiary / ghost / accent / destructive / link, sm/md/lg/icon, loading) · card
(+ header/action/footer) · badge + StatusBadge (dot/pulse like deployment statuses) · stat-card + DeltaBadge ·
input / textarea · label · select · segmented control · switch · slider · progress · skeleton · separator · kbd ·
avatar · dialog · alert-dialog · sheet · popover · tooltip · dropdown-menu · tabs · accordion · collapsible ·
scroll-area · command (⌘K) · table · empty-state / error-state · page-header · sonner toaster.

## App shell (`apps/web/src/components/shell`)

`Navbar` (logo / breadcrumb `Prasad › Dashboard`, ⌘K search, theme toggle, avatar menu) + `TabBar` with the
animated sliding underline and hover pill (Vercel project nav). No sidebar. `CommandMenuProvider` wires ⌘K.

## Review

`/design` (dev-only; `FLUENT_ENABLE_DESIGN_PAGE=1` to expose in prod) renders every primitive in every state.
Screenshots: `docs/screenshots/design-*.png`.
