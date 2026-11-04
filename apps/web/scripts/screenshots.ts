/**
 * `pnpm screenshots` — logs in and captures every page in dark mode at 1440px and 390px into docs/screenshots.
 * Requires a running app (`pnpm dev` or `next start`) and seeded data (`pnpm db:seed && pnpm seed:demo`).
 * Env: E2E_BASE_URL (default http://localhost:3000), E2E_EMAIL, E2E_PASSWORD, SCREENSHOT_DIR, PLAYWRIGHT_EXECUTABLE.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const email = process.env.E2E_EMAIL ?? process.env.OWNER_EMAIL ?? "owner@example.com";
const password = process.env.E2E_PASSWORD ?? "";
const outDir = process.env.SCREENSHOT_DIR ?? path.resolve(__dirname, "../../../docs/screenshots");
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE;

async function main() {
  if (!password) throw new Error("Set E2E_PASSWORD to the owner password.");
  mkdirSync(outDir, { recursive: true });
  const prisma = new PrismaClient();
  const complete = await prisma.session.findFirst({
    where: { status: "complete" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  await prisma.$disconnect();

  const pages: { name: string; path: string; fullPage?: boolean; public?: boolean }[] = [
    { name: "landing", path: "/", public: true },
    { name: "login", path: "/login", public: true },
    { name: "overview", path: "/dashboard" },
    { name: "progress", path: "/dashboard/progress" },
    { name: "sessions", path: "/dashboard/sessions" },
    { name: "mistakes", path: "/dashboard/mistakes" },
    { name: "vocabulary", path: "/dashboard/vocabulary" },
    { name: "pronunciation", path: "/dashboard/pronunciation" },
    { name: "goals", path: "/dashboard/goals" },
    { name: "settings", path: "/dashboard/settings" },
    { name: "scenarios", path: "/scenarios" },
    { name: "practice-launcher", path: "/practice" },
    ...(complete ? [{ name: "session-report", path: `/sessions/${complete.id}` }] : []),
    { name: "admin-health", path: "/admin/health" },
    { name: "design", path: "/design" },
  ];

  const browser = await chromium.launch({
    executablePath,
    args: ["--proxy-server=direct://", "--proxy-bypass-list=*"],
  });
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      colorScheme: "dark",
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(`${base}/login`, { waitUntil: "load" });
    await page.fill("#email", email);
    await page.fill("#password", password);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 60_000 }),
      page.click("button[type=submit]"),
    ]);
    for (const p of pages) {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${base}${p.path}`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(1200);
      const file = path.join(outDir, `${p.name}-dark-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(
        `${p.name.padEnd(18)} ${width}px → ${path.relative(process.cwd(), file)}${errors.length ? `  ⚠ ${errors.length} page errors` : ""}`,
      );
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
