import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirror the "@/*" path alias from tsconfig so tests can import "@/lib/...".
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // *.live.test.ts calls real APIs (cost, quota, network), so it only runs when asked: LIVE=1 npx vitest run
    exclude: process.env.LIVE ? ["**/node_modules/**"] : ["**/node_modules/**", "**/*.live.test.ts"],
    // No tests exist until M1; without this `npm test` would fail the pre-commit check.
    passWithNoTests: true,
  },
});
