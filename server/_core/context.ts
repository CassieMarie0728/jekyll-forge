import type { User } from "../../drizzle/schema";
import type { SerializeOptions } from "cookie";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: {
    headers: { authorization?: string; cookie?: string };
    protocol: string;
  };
  res: { clearCookie(name: string, options: SerializeOptions): unknown };
  user: User | null;
};
export async function createContext(
  opts: Omit<TrpcContext, "user">
): Promise<TrpcContext> {
  const user = await sdk.authenticateRequest(opts.req).catch(() => null);
  return { ...opts, user };
}
