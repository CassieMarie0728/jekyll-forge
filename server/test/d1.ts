import { createRequire } from "node:module";
const { DatabaseSync } = createRequire(import.meta.url)(
  "node:sqlite"
) as typeof import("node:sqlite");
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// Real SQLite for repository tests, with the small D1 surface used by Drizzle.
// No network, developer database, or GitHub repository is touched.
export function testDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  const migrations = resolve("drizzle/d1");
  for (const file of readdirSync(migrations)
    .filter(f => f.endsWith(".sql"))
    .sort()) {
    sqlite.exec(readFileSync(resolve(migrations, file), "utf8"));
  }
  function prepare(sql: string, parameters: any[] = []): any {
    return {
      bind: (...values: any[]) => prepare(sql, values),
      first: async () => sqlite.prepare(sql).get(...parameters) ?? null,
      all: async () => ({
        success: true,
        results: sqlite.prepare(sql).all(...parameters),
      }),
      raw: async () => {
        const statement = sqlite.prepare(sql);
        statement.setReturnArrays(true);
        return statement.all(...parameters);
      },
      run: async () => {
        const result = sqlite.prepare(sql).run(...parameters);
        return {
          success: true,
          meta: {
            changes: Number(result.changes),
            last_row_id: Number(result.lastInsertRowid),
          },
        };
      },
    };
  }
  return { sqlite, binding: { prepare } as unknown as D1Database };
}
export function testEnv(DB: D1Database): CloudflareBindings {
  return {
    DB,
    JWT_SECRET: "local-test-secret-with-at-least-32-characters",
    GITHUB_CLIENT_ID: "test-client",
    GITHUB_CLIENT_SECRET: "test-secret",
    APP_URL: "https://forge.example.test",
    OWNER_GITHUB_ID: "7",
  } as unknown as CloudflareBindings;
}
