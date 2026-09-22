import { AsyncLocalStorage } from "node:async_hooks";

// Each fetch/cron event owns its bindings. Never share credentials or a D1
// connection through mutable module-global request state.
const runtime = new AsyncLocalStorage<CloudflareBindings>();

export function withRuntime<T>(env: CloudflareBindings, work: () => T): T {
  return runtime.run(env, work);
}

export function getRuntimeEnv(): CloudflareBindings {
  const env = runtime.getStore();
  if (!env) throw new Error("Cloudflare request context is unavailable");
  return env;
}
