import type { SerializeOptions } from "cookie";
export function getSessionCookieOptions(req: {
  protocol: string;
}): SerializeOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: req.protocol === "https",
  };
}
