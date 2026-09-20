import { getRuntimeEnv } from "./runtime";
export type NotificationPayload = { title: string; content: string };
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  if (!payload.title.trim() || !payload.content.trim())
    throw new Error("Notification title and content are required");
  await getRuntimeEnv()
    .DB.prepare(
      "INSERT INTO operator_notifications (title, content, createdAt) VALUES (?, ?, ?)"
    )
    .bind(
      payload.title.slice(0, 1200),
      payload.content.slice(0, 20000),
      Math.floor(Date.now() / 1000)
    )
    .run();
  return true;
}
