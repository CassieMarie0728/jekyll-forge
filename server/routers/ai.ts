import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAiSettings, upsertAiSettings, incrementAiUsage } from "../db";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const AI_TASK_PROMPTS: Record<string, string> = {
  title:
    "Generate 5 compelling blog post titles for the following content. Return as a numbered list.",
  outline:
    "Generate a detailed blog post outline with sections and subsections. Return as Markdown.",
  draft:
    "Write a complete, well-structured blog post based on the following outline or topic. Use Markdown formatting.",
  rewrite:
    "Rewrite the following text to improve clarity, flow, and engagement. Preserve the core meaning and author's voice.",
  continue:
    "Continue writing the blog post from where it left off. Match the existing tone and style.",
  shorter:
    "Make the following text more concise while preserving all key information.",
  longer: "Expand the following text with more detail, examples, and depth.",
  tone: "Rewrite the following text in the requested tone. Preserve the meaning.",
  grammar:
    "Fix grammar, spelling, and punctuation in the following text. Return only the corrected text.",
  seo: 'Generate an SEO-optimized title and meta description for this blog post. Return as JSON: {"seoTitle": "...", "metaDescription": "..."}',
  tags: "Generate 5-8 relevant tags for this blog post. Return as a comma-separated list.",
  categories:
    "Suggest 1-3 categories for this blog post. Return as a comma-separated list.",
  slug: "Generate a URL-friendly slug for this blog post title. Return only the slug, lowercase with hyphens.",
  excerpt:
    "Write a compelling 1-2 sentence excerpt for this blog post. Return only the excerpt.",
  "alt-text":
    "Generate descriptive, accessible alt text for an image. Return only the alt text.",
  "markdown-cleanup":
    "Clean up and properly format the following Markdown. Fix heading hierarchy, spacing, and formatting issues.",
  "front-matter-cleanup":
    "Review and improve the Jekyll front matter YAML. Return only the improved YAML block (without --- delimiters).",
  faq: "Generate a FAQ section with 5 relevant questions and answers based on this blog post. Format as Markdown.",
  social:
    "Generate social media posts for Twitter/X, LinkedIn, and Mastodon based on this blog post. Format as Markdown with platform headers.",
  summary: "Write a concise 3-5 sentence summary of this blog post.",
  "internal-links":
    "Suggest 3-5 internal link opportunities in this post. Return as a list of anchor text suggestions.",
  callout:
    "Generate a relevant callout box for this content. Return as Markdown with a blockquote.",
  toc: "Generate a table of contents for this blog post based on its headings. Return as Markdown.",
  "convert-html":
    "Convert the following HTML to clean, well-formatted Markdown. Preserve all content.",
};

export const aiRouter = router({
  getSettings: protectedProcedure.query(({ ctx }) =>
    getAiSettings(ctx.user.id)
  ),

  updateSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        temperature: z.number().min(0).max(100).optional(),
        maxTokens: z.number().min(100).max(8000).optional(),
        systemPrompt: z.string().optional(),
        brandVoicePrompt: z.string().optional(),
        safetyPrompt: z.string().optional(),
        streaming: z.boolean().optional(),
        defaultLanguage: z.string().optional(),
        budgetLimitCents: z.number().optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) =>
      upsertAiSettings({ ...input, userId: ctx.user.id })
    ),

  generate: protectedProcedure
    .input(
      z.object({
        task: z.string(),
        userPrompt: z.string().optional(),
        selectedText: z.string().optional(),
        postMarkdown: z.string().optional(),
        frontMatter: z.record(z.string(), z.unknown()).optional(),
        tone: z.string().optional(),
        voiceProfileId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await getAiSettings(ctx.user.id);
      if (settings && !settings.enabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI features are disabled. Enable them in AI Settings.",
        });
      }

      const taskPrompt =
        AI_TASK_PROMPTS[input.task] ||
        input.userPrompt ||
        "Help with the following content:";

      let systemPrompt =
        settings?.systemPrompt ||
        "You are a professional blog writing assistant specializing in Jekyll and static site content.";
      if (settings?.brandVoicePrompt)
        systemPrompt += `\n\nBrand voice: ${settings.brandVoicePrompt}`;
      if (input.tone) systemPrompt += `\n\nTone: ${input.tone}`;

      // Build user message
      const parts: string[] = [taskPrompt];
      if (input.frontMatter)
        parts.push(
          `\n\nFront matter:\n${JSON.stringify(input.frontMatter, null, 2)}`
        );
      if (input.selectedText)
        parts.push(`\n\nSelected text:\n${input.selectedText}`);
      else if (input.postMarkdown)
        parts.push(`\n\nPost content:\n${input.postMarkdown.slice(0, 4000)}`);
      if (input.userPrompt && input.task !== "custom")
        parts.push(`\n\nAdditional instructions: ${input.userPrompt}`);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: parts.join("") },
        ],
      });

      const rawText = response.choices[0]?.message?.content;
      const text = typeof rawText === "string" ? rawText : "";
      const usage = response.usage;

      // Track usage
      if (usage) {
        await incrementAiUsage(
          ctx.user.id,
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0
        );
      }

      return {
        text,
        usage: {
          inputTokens: usage?.prompt_tokens,
          outputTokens: usage?.completion_tokens,
        },
      };
    }),

  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const settings = await getAiSettings(ctx.user.id);
    return {
      totalRequests: settings?.totalRequestCount || 0,
      totalInputTokens: settings?.totalInputTokens || 0,
      totalOutputTokens: settings?.totalOutputTokens || 0,
      estimatedCostCents: Math.round(
        ((settings?.totalInputTokens || 0) * 0.0015 +
          (settings?.totalOutputTokens || 0) * 0.002) /
          1000
      ),
      budgetLimitCents: settings?.budgetLimitCents,
    };
  }),
});
