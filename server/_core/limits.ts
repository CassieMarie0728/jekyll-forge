import { getRuntimeEnv } from "./runtime";

// One conditional statement atomically checks and consumes a window across
// all isolates. Expired rows are periodically removed by the scheduled event.
export async function consumeLimit(
  key: string,
  maximum: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSeconds);
  const row = await getRuntimeEnv()
    .DB.prepare(
      "INSERT INTO rate_windows (key, count, expiresAt) VALUES (?, 1, ?) " +
        "ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count"
    )
    .bind(`${key}:${bucket}`, (bucket + 1) * windowSeconds, maximum)
    .first<{ count: number }>();
  return row !== null;
}

export async function readLimit(
  key: string,
  maximum: number,
  windowSeconds: number
) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const row = await getRuntimeEnv()
    .DB.prepare("SELECT count FROM rate_windows WHERE key = ?")
    .bind(`${key}:${bucket}`)
    .first<{ count: number }>();
  return {
    remaining: Math.max(0, maximum - (row?.count ?? 0)),
    resetAt: new Date((bucket + 1) * windowSeconds * 1000),
  };
}
