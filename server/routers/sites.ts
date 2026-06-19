import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSitesByUserId,
  getSiteById,
  upsertSite,
  updateSite,
  deleteSite,
} from "../db";

export const sitesRouter = router({
  list: protectedProcedure.query(({ ctx }) => getSitesByUserId(ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getSiteById(input.id, ctx.user.id)),

  upsert: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        defaultBranch: z.string().optional(),
        selectedBranch: z.string().optional(),
        rootPath: z.string().optional(),
        isJekyll: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
        timezone: z.string().optional(),
        defaultLayout: z.string().optional(),
        defaultAssetPath: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      upsertSite({ ...input, userId: ctx.user.id })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        isFavorite: z.boolean().optional(),
        selectedBranch: z.string().optional(),
        rootPath: z.string().optional(),
        timezone: z.string().optional(),
        defaultLayout: z.string().optional(),
        defaultAssetPath: z.string().optional(),
        aiVoiceProfile: z.string().optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateSite(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteSite(input.id, ctx.user.id)),
});
