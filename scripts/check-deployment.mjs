import { readFileSync } from "node:fs";

// Keep this JSONC file valid JSON so this guard needs no extra parser dependency.
const config = JSON.parse(
  readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8")
);
const origin = new URL(config.vars.APP_URL);
const database = config.d1_databases.find(item => item.binding === "DB");
if (
  origin.protocol !== "https:" ||
  ["localhost", "127.0.0.1"].includes(origin.hostname) ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash ||
  !database?.database_id ||
  database.database_id === "00000000-0000-0000-0000-000000000000" ||
  !config.vars.GITHUB_CLIENT_ID ||
  !/^\d+$/.test(config.vars.OWNER_GITHUB_ID)
) {
  throw new Error(
    "Configure the production HTTPS origin, real D1 database ID, GitHub OAuth client ID, and owner GitHub numeric ID before deployment. See CLOUDFLARE_SETUP.md."
  );
}
console.log(
  "Production configuration contains no development placeholders. Verify the account is on Workers Free before publishing."
);
