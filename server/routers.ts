import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { githubRouter } from "./routers/github";
import { sitesRouter } from "./routers/sites";
import { postsRouter } from "./routers/posts";
import { assetsRouter } from "./routers/assets";
import { aiRouter } from "./routers/ai";
import { snapshotsRouter } from "./routers/snapshots";
import { schedulerRouter } from "./routers/scheduler";
import { blocksRouter } from "./routers/blocks";
import { repurposingRouter } from "./routers/repurposing";
import { socialMediaRouter } from "./routers/socialMedia";
import { abTestingRouter } from "./routers/abTesting";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    exchangeMobileCode: publicProcedure
      .input(z.object({ code: z.string().min(32).max(256) }))
      .mutation(async ({ input }) => {
        const user = await db.consumeMobileAuthCode(input.code);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "The mobile authorization code is invalid, expired, or already used.",
          });
        }

        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        return {
          token,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),
  }),
  github: githubRouter,
  sites: sitesRouter,
  posts: postsRouter,
  assets: assetsRouter,
  ai: aiRouter,
  snapshots: snapshotsRouter,
  scheduler: schedulerRouter,
  blocks: blocksRouter,
  repurposing: repurposingRouter,
  socialMedia: socialMediaRouter,
  abTesting: abTestingRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
