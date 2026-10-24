import { defineConfig } from "vitest/config"
import path from "node:path"

// Scoped to pure-function/unit tests only, same convention as ilovelawyer-app's web package —
// no component/E2E harness here.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
})
