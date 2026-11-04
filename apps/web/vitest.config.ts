import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    env: { FLUENT_SKIP_ENV_VALIDATION: "1" },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
