import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getAssetsBySiteId, createAsset, updateAsset, deleteAsset, findAssetByHash } from "../db";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import crypto from "crypto";

export const assetsRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => getAssetsBySiteId(input.siteId, ctx.user.id)),

  upload: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string(),
      path: z.string(),
      base64Content: z.string(),
      mimeType: z.string(),
      size: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
      optimize: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Decode base64
      const buffer = Buffer.from(input.base64Content, "base64");

      // Hash for duplicate detection
      const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
      const existing = await findAssetByHash(hash, input.siteId, ctx.user.id);
      if (existing) {
        return { ...existing, isDuplicate: true };
      }

      // Warn on large images
      const sizeMB = input.size / (1024 * 1024);
      const sizeWarning = sizeMB > 1 ? `This image is ${sizeMB.toFixed(1)}MB. Page speed crimes are being committed. Consider optimizing.` : null;

      // Store to S3
      const storageKey = `assets/${ctx.user.id}/${input.siteId}/${Date.now()}-${input.name}`;
      const { url } = await storagePut(storageKey, buffer, input.mimeType);

      const id = await createAsset({
        userId: ctx.user.id,
        siteId: input.siteId,
        name: input.name,
        path: input.path,
        storageKey,
        storageUrl: url,
        mimeType: input.mimeType,
        size: input.size,
        width: input.width,
        height: input.height,
        hash,
        optimized: false,
      });

      const asset = await (await import("../db")).getAssetsBySiteId(input.siteId, ctx.user.id).then(a => a.find(x => x.id === id));
      return { ...asset, isDuplicate: false, sizeWarning };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), path: z.string().optional(),
      alt: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateAsset(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteAsset(input.id, ctx.user.id)),

  generateAltText: protectedProcedure
    .input(z.object({ assetId: z.number(), imageUrl: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an accessibility expert. Generate concise, descriptive alt text for images used in blog posts. Return only the alt text, no quotes, no explanation." },
          { role: "user", content: [
            { type: "text", text: `Generate alt text for this image. The filename is: ${input.name}` },
            { type: "image_url", image_url: { url: input.imageUrl, detail: "low" } },
          ]},
        ],
      });
      const rawContent = response.choices[0]?.message?.content;
      const altText = (typeof rawContent === "string" ? rawContent.trim() : "") || "";
      if (altText) {
        await updateAsset(input.assetId, ctx.user.id, { alt: altText });
      }
      return { altText };
    }),
});
