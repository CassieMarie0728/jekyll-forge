import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  registerMobileDeviceToken,
  revokeMobileDeviceToken,
} from "../db";

export const notificationsRouter = router({
  registerDevice: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1).max(512),
        platform: z.enum(["android"]).default("android"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await registerMobileDeviceToken(ctx.user.id, input.token, input.platform);
      return { success: true } as const;
    }),

  unregisterDevice: protectedProcedure
    .input(z.object({ token: z.string().min(1).max(512) }))
    .mutation(async ({ ctx, input }) => {
      await revokeMobileDeviceToken(ctx.user.id, input.token);
      return { success: true } as const;
    }),
});
