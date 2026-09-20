import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { invokeUserOwnedFreeAi } from "../ai/freeProvider";
import { createHash } from "node:crypto";

export function repositoryAssetPath(value: string) {
  const path = value.replace(/^\/+/, "");
  if (
    !path ||
    /[\\?#\x00-\x1f]/.test(path) ||
    path
      .split("/")
      .some(p => !p || p === "." || p === ".." || p.startsWith("."))
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid asset path" });
  }
  return path;
}
export const assetsRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => db.getAssetsBySiteId(input.siteId, ctx.user.id)),
  upload: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        name: z.string().min(1).max(256),
        path: z.string(),
        base64Content: z.string().max(7_000_000),
        mimeType: z.string(),
        size: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        optimize: z.boolean().default(false),
        maxWidth: z.number().optional(),
        outputFormat: z.enum(["webp", "jpeg", "png", "original"]).optional(),
        quality: z.number().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.siteId, ctx.user.id);
      if (!site)
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user?.githubToken)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Connect GitHub before uploading repository assets",
        });
      const bytes = Buffer.from(input.base64Content, "base64");
      if (!bytes.length || bytes.length > 5 * 1024 * 1024)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Asset must be between 1 byte and 5 MB",
        });
      // Restrict files to the configured asset directory, not workflow/config paths.
      const root = (site.rootPath ?? "").replace(/^\/+|\/+$/g, "");
      const assetDirectory = repositoryAssetPath(
        site.defaultAssetPath || "assets/images"
      );
      const file = input.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      if (!file || file.startsWith("."))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid asset filename",
        });
      const hash = createHash("sha256").update(bytes).digest("hex");
      const existing = await db.findAssetByHash(hash, site.id, ctx.user.id);
      if (existing)
        return {
          ...existing,
          isDuplicate: true,
          sizeWarning: null,
          savings: null,
        };
      const path = repositoryAssetPath(
        [root, assetDirectory, hash.slice(0, 12) + "-" + file]
          .filter(Boolean)
          .join("/")
      );
      const branch = site.selectedBranch || site.defaultBranch || "main";
      const endpoint = `https://api.github.com/repos/${encodeURIComponent(site.owner)}/${encodeURIComponent(site.repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Jekyll-Forge",
        },
        body: JSON.stringify({
          branch,
          message: `Add asset ${file}`,
          content: bytes.toString("base64"),
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `GitHub asset upload failed (${response.status}). Check branch and repository permissions.`,
        });
      const result = (await response.json()) as {
        content?: { sha?: string; download_url?: string };
      };
      const url = result.content?.download_url;
      if (!url)
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            "GitHub saved the file but returned no asset URL. Check the repository before retrying.",
        });
      const id = await db.createAsset({
        userId: ctx.user.id,
        siteId: site.id,
        name: file,
        path: "/" + [assetDirectory, hash.slice(0, 12) + "-" + file].join("/"),
        storageKey: path,
        branch,
        storageUrl: null,
        mimeType: input.mimeType,
        size: bytes.length,
        width: input.width,
        height: input.height,
        sha: result.content?.sha,
        hash,
        optimized: false,
      });
      await db.updateAsset(id, ctx.user.id, {
        storageUrl: `/api/assets/${id}`,
      });
      const asset = await db.getAssetById(id, ctx.user.id);
      return {
        ...asset!,
        isDuplicate: false,
        sizeWarning: input.optimize
          ? "Uploaded the supplied file. Optimize images in the web uploader before committing."
          : null,
        savings: null,
      };
    }),
  reoptimize: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        maxWidth: z.number().optional(),
        outputFormat: z.enum(["webp", "jpeg", "png"]).optional(),
        quality: z.number().optional(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{
        storageUrl: string;
        width: number;
        height: number;
        size: number;
      }> => {
        if (!(await db.getAssetById(input.id, ctx.user.id)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Asset not found",
          });
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Optimize and upload a new copy in the web app. Existing GitHub images are preserved.",
        });
      }
    ),
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
      return db.updateAsset(id, ctx.user.id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteAsset(input.id, ctx.user.id)),
  generateAltText: protectedProcedure
    .input(z.object({ assetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await db.getAssetById(input.assetId, ctx.user.id);
      if (!asset)
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const response = await invokeUserOwnedFreeAi({
        userId: ctx.user.id,
        messages: [
          {
            role: "system",
            content:
              "Suggest concise alt text using only the filename. Do not claim to see the image. Return only alt text, at most 125 characters.",
          },
          { role: "user", content: asset.name },
        ],
      });
      const altText = response.text.trim();
      await db.updateAsset(asset.id, ctx.user.id, { alt: altText });
      return { altText };
    }),
});
