import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
});

export type AppRouter = typeof appRouter;
