import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getReusableBlocks,
  createReusableBlock,
  updateReusableBlock,
  deleteReusableBlock,
} from "../db";

export const blocksRouter = router({
  list: protectedProcedure.query(({ ctx }) => getReusableBlocks(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        content: z.string().min(1),
        contentType: z.enum(["markdown", "html", "liquid"]).default("markdown"),
      })
    )
    .mutation(({ ctx, input }) =>
      createReusableBlock({ ...input, userId: ctx.user.id })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        content: z.string().optional(),
        contentType: z.enum(["markdown", "html", "liquid"]).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateReusableBlock(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteReusableBlock(input.id, ctx.user.id)),
});
