import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.tsx", "client/**/*.spec.tsx"],
    setupFiles: ["client/src/test/setup.ts"],
    globals: true,
  },
});
