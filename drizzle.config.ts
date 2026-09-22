import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/d1",
  dialect: "sqlite",
});
