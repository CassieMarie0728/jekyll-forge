import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  activateUserAiProvider,
  deleteUserAiProvider,
  getUserAiProviders,
  upsertUserAiProvider,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  PROVIDER_CATALOG,
  SUPPORTED_AI_PROVIDERS,
  assertFreeModelAllowed,
  encryptProviderApiKey,
  freeAiProviderRateLimiter,
  testProviderApiKey,
} from "../ai/freeProvider";

const providerSchema = z.enum(SUPPORTED_AI_PROVIDERS);

function toPublicProviderSettings(
  userId: number,
  configured: Awaited<ReturnType<typeof getUserAiProviders>>
) {
  return SUPPORTED_AI_PROVIDERS.map(provider => {
    const saved = configured.find(item => item.provider === provider);
    const catalog = PROVIDER_CATALOG[provider];
    return {
      provider,
      label: catalog.label,
      available: catalog.available,
      setupUrl: catalog.setupUrl,
      disclosure: catalog.disclosure,
      models: catalog.models,
      configured: Boolean(saved),
      enabled: saved?.enabled ?? false,
      selectedModel: saved?.selectedModel ?? null,
      updatedAt: saved?.updatedAt ?? null,
      rateLimit: catalog.rateLimit,
      usage: freeAiProviderRateLimiter.getStatus(userId, provider),
    };
  });
}

export const aiProvidersRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const configured = await getUserAiProviders(ctx.user.id);
    return toPublicProviderSettings(ctx.user.id, configured);
  }),

  save: protectedProcedure
    .input(
      z.object({
        provider: providerSchema,
        model: z.string().min(1).max(160),
        apiKey: z.string().trim().min(8).max(1024),
        acknowledgeFreeTier: z.literal(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { provider, model } = assertFreeModelAllowed(
        input.provider,
        input.model
      );
      await testProviderApiKey(provider, input.apiKey);
      await upsertUserAiProvider({
        userId: ctx.user.id,
        provider,
        selectedModel: model,
        encryptedApiKey: encryptProviderApiKey(input.apiKey),
        enabled: true,
      });
      await activateUserAiProvider(ctx.user.id, provider);
      return { success: true, provider, model };
    }),

  test: protectedProcedure
    .input(
      z.object({
        provider: providerSchema,
        model: z.string().min(1).max(160),
        apiKey: z.string().trim().min(8).max(1024),
      })
    )
    .mutation(async ({ input }) => {
      const { provider } = assertFreeModelAllowed(input.provider, input.model);
      await testProviderApiKey(provider, input.apiKey);
      return { success: true };
    }),

  activate: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ ctx, input }) => {
      const configured = await getUserAiProviders(ctx.user.id);
      const record = configured.find(item => item.provider === input.provider);
      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configure this provider before activating it.",
        });
      }
      assertFreeModelAllowed(record.provider, record.selectedModel);
      await activateUserAiProvider(ctx.user.id, input.provider);
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteUserAiProvider(ctx.user.id, input.provider);
      return { success: true };
    }),
});
