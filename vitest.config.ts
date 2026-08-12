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
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.test.ts",
      "client/**/*.spec.ts",
      "client/**/*.test.tsx",
      "client/**/*.spec.tsx",
    ],
    exclude: ["**/node_modules/**"],
    setupFiles: ["client/src/test/setup.ts"],
    globals: true,
  },
});
