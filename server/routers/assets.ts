import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAssetsBySiteId,
  getAssetById,
  getSiteById,
  createAsset,
  updateAsset,
  deleteAsset,
  findAssetByHash,
} from "../db";
import { storagePut } from "../storage";
import { invokeUserOwnedFreeAi } from "../ai/freeProvider";
import {
  optimizeImage,
  optimizeImageSet,
  getImageMetadata,
  isImageBuffer,
} from "../imageOptimizer";
import crypto from "crypto";

export const assetsRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => getAssetsBySiteId(input.siteId, ctx.user.id)),

  upload: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        name: z.string(),
        path: z.string(),
        base64Content: z.string(),
        mimeType: z.string(),
        size: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        /** Whether to run the optimization pipeline (resize, compress, WEBP, EXIF strip) */
        optimize: z.boolean().default(true),
        /** Target max width for optimization. Default: 1920 */
        maxWidth: z.number().default(1920),
        /** Output format. Default: webp */
        outputFormat: z
          .enum(["webp", "jpeg", "png", "original"])
          .default("webp"),
        /** Quality 1-100. Default: 82 */
        quality: z.number().min(1).max(100).default(82),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await getSiteById(input.siteId, ctx.user.id);
      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      const rawBuffer = Buffer.from(input.base64Content, "base64");

      // Hash original for duplicate detection
      const hash = crypto
        .createHash("sha256")
        .update(rawBuffer)
        .digest("hex")
        .slice(0, 16);
      const existing = await findAssetByHash(hash, input.siteId, ctx.user.id);
      if (existing) {
        return {
          ...existing,
          isDuplicate: true,
          optimized: false,
          sizeWarning: null,
          savings: null,
        };
      }

      let uploadBuffer: Buffer = rawBuffer;
      let finalMimeType = input.mimeType;
      let finalWidth = input.width;
      let finalHeight = input.height;
      let optimized = false;
      let savings: {
        originalSize: number;
        optimizedSize: number;
        savedPercent: number;
      } | null = null;

      // Run optimization pipeline for images
      const isImage =
        isImageBuffer(rawBuffer) || input.mimeType.startsWith("image/");
      if (
        input.optimize &&
        isImage &&
        input.mimeType !== "image/gif" &&
        input.mimeType !== "image/svg+xml"
      ) {
        try {
          const result = await optimizeImage(rawBuffer, {
            maxWidth: input.maxWidth,
            format:
              input.outputFormat === "original" ? "webp" : input.outputFormat,
            quality: input.quality,
            stripMetadata: true,
          });

          uploadBuffer = result.data;
          finalMimeType = result.mimeType;
          finalWidth = result.width;
          finalHeight = result.height;
          optimized = true;

          const savedBytes = rawBuffer.length - result.size;
          const savedPercent = Math.round(
            (savedBytes / rawBuffer.length) * 100
          );
          savings = {
            originalSize: rawBuffer.length,
            optimizedSize: result.size,
            savedPercent: Math.max(0, savedPercent),
          };
        } catch (err) {
          // Optimization failed — fall back to original
          console.warn(
            "[Assets] Image optimization failed, using original:",
            err instanceof Error ? err.message : err
          );
        }
      } else if (isImage && !finalWidth && !finalHeight) {
        // Get metadata for non-optimized images
        try {
          const meta = await getImageMetadata(rawBuffer);
          finalWidth = meta.width;
          finalHeight = meta.height;
        } catch {
          /* ignore */
        }
      }

      // Warn on large images (>500KB after optimization)
      const finalSize = uploadBuffer.length;
      const sizeKB = finalSize / 1024;
      const sizeWarning =
        sizeKB > 500
          ? `This image is ${(sizeKB / 1024).toFixed(1)}MB after optimization. Consider using a lower quality setting or smaller dimensions.`
          : null;

      // Derive the final filename with correct extension
      let finalName = input.name;
      if (optimized && input.outputFormat === "webp") {
        finalName = input.name.replace(
          /\.(jpe?g|png|avif|bmp|tiff?)$/i,
          ".webp"
        );
        if (!finalName.endsWith(".webp")) finalName += ".webp";
      }

      // Generate responsive variants for images (thumbnail 300px, medium 800px, large 1200px)
      let variants:
        | { thumbnail?: string; medium?: string; large?: string }
        | undefined;
      if (
        isImage &&
        input.mimeType !== "image/gif" &&
        input.mimeType !== "image/svg+xml"
      ) {
        try {
          const variantFormat =
            input.outputFormat === "original" ? "webp" : input.outputFormat;
          const [thumb, medium, large] = await Promise.all([
            optimizeImage(rawBuffer, {
              maxWidth: 300,
              format: variantFormat,
              quality: 75,
              stripMetadata: true,
            }),
            optimizeImage(rawBuffer, {
              maxWidth: 800,
              format: variantFormat,
              quality: 80,
              stripMetadata: true,
            }),
            optimizeImage(rawBuffer, {
              maxWidth: 1200,
              format: variantFormat,
              quality: 82,
              stripMetadata: true,
            }),
          ]);
          const ts = Date.now();
          const ext =
            variantFormat === "webp"
              ? ".webp"
              : variantFormat === "jpeg"
                ? ".jpg"
                : `.${variantFormat}`;
          const baseName = finalName.replace(/\.[^.]+$/, "");
          const [thumbResult, medResult, lgResult] = await Promise.all([
            storagePut(
              `assets/${ctx.user.id}/${input.siteId}/${ts}-${baseName}-thumb${ext}`,
              Buffer.from(thumb.data),
              thumb.mimeType
            ),
            storagePut(
              `assets/${ctx.user.id}/${input.siteId}/${ts}-${baseName}-medium${ext}`,
              Buffer.from(medium.data),
              medium.mimeType
            ),
            storagePut(
              `assets/${ctx.user.id}/${input.siteId}/${ts}-${baseName}-large${ext}`,
              Buffer.from(large.data),
              large.mimeType
            ),
          ]);
          variants = {
            thumbnail: thumbResult.url,
            medium: medResult.url,
            large: lgResult.url,
          };
        } catch (err) {
          console.warn(
            "[Assets] Variant generation failed:",
            err instanceof Error ? err.message : err
          );
        }
      }

      // Store to S3
      const storageKey = `assets/${ctx.user.id}/${input.siteId}/${Date.now()}-${finalName}`;
      const { url } = await storagePut(
        storageKey,
        Buffer.from(uploadBuffer),
        finalMimeType
      );

      const id = await createAsset({
        userId: ctx.user.id,
        siteId: input.siteId,
        name: finalName,
        path: input.path,
        storageKey,
        storageUrl: url,
        mimeType: finalMimeType,
        size: finalSize,
        width: finalWidth,
        height: finalHeight,
        hash,
        optimized,
        variants,
      });

      const assets = await getAssetsBySiteId(input.siteId, ctx.user.id);
      const asset = assets.find(x => x.id === id);
      return { ...asset, isDuplicate: false, sizeWarning, savings, optimized };
    }),

  /**
   * Re-optimize an existing asset (e.g., change quality or format).
   */
  reoptimize: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        maxWidth: z.number().default(1920),
        outputFormat: z.enum(["webp", "jpeg", "png"]).default("webp"),
        quality: z.number().min(1).max(100).default(82),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await getAssetById(input.id, ctx.user.id);
      if (!asset?.storageUrl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      }

      // Fetch only the caller-owned persisted storage URL, never a request-supplied URL.
      const fetchRes = await fetch(asset.storageUrl);
      if (!fetchRes.ok)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found in storage",
        });
      const arrayBuffer = await fetchRes.arrayBuffer();
      const rawBuffer = Buffer.from(arrayBuffer);

      const result = await optimizeImage(rawBuffer, {
        maxWidth: input.maxWidth,
        format: input.outputFormat,
        quality: input.quality,
        stripMetadata: true,
      });

      const storageKey = `assets/${ctx.user.id}/${asset.siteId}/${Date.now()}-optimized.${input.outputFormat}`;
      const { url } = await storagePut(
        storageKey,
        result.data,
        result.mimeType
      );

      await updateAsset(input.id, ctx.user.id, {
        storageKey,
        storageUrl: url,
        mimeType: result.mimeType,
        size: result.size,
        width: result.width,
        height: result.height,
        optimized: true,
      });

      return {
        storageUrl: url,
        width: result.width,
        height: result.height,
        size: result.size,
        savings: {
          originalSize: rawBuffer.length,
          optimizedSize: result.size,
          savedPercent: Math.max(
            0,
            Math.round(
              ((rawBuffer.length - result.size) / rawBuffer.length) * 100
            )
          ),
        },
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        path: z.string().optional(),
        alt: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateAsset(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteAsset(input.id, ctx.user.id)),

  generateAltText: protectedProcedure
    .input(z.object({ assetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await getAssetById(input.assetId, ctx.user.id);
      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      }
      const response = await invokeUserOwnedFreeAi({
        userId: ctx.user.id,
        messages: [
          {
            role: "system",
            content:
              "You are an accessibility expert. Suggest concise alt text for a blog image using only its filename and path. Do not claim to have viewed the image. Return only the suggested alt text, no quotes, no explanation. Maximum 125 characters.",
          },
          {
            role: "user",
            content: `Suggest alt text for the filename "${asset.name}" at path "${asset.path}".`,
          },
        ],
      });
      const altText = response.text.trim();
      if (altText) {
        await updateAsset(input.assetId, ctx.user.id, { alt: altText });
      }
      return { altText };
    }),
});
