/**
 * Content Repurposing Prompts
 * Specialized prompts for transforming blog posts into different formats
 */

export type RepurposingFormat = "twitter" | "linkedin" | "tiktok" | "youtube" | "newsletter" | "email" | "podcast" | "slides";

export const repurposingPrompts: Record<RepurposingFormat, string> = {
  twitter: `Transform the following blog post into a Twitter thread (5-7 tweets). Each tweet should be engaging, under 280 characters, and build on the previous one. Use relevant hashtags and emojis. Format as a numbered list (1/, 2/, etc.).

Blog Post:
{content}

Twitter Thread:`,

  linkedin: `Transform the following blog post into a professional LinkedIn article (300-500 words). Use a professional tone, include a compelling hook, break into sections with subheadings, and end with a call-to-action. Make it suitable for LinkedIn's professional audience.

Blog Post:
{content}

LinkedIn Article:`,

  tiktok: `Transform the following blog post into a TikTok script (30-60 seconds when read at normal pace). Make it engaging, use trendy language, include hooks, and structure it for short-form video. Include suggested on-screen text in [brackets] and visual cues in {braces}.

Blog Post:
{content}

TikTok Script:`,

  youtube: `Transform the following blog post into a YouTube video description and chapter outline. Include:
1. A compelling 150-200 character title
2. A 300-500 word description with keywords
3. Chapter timestamps (00:00, 02:30, 05:00, etc.)
4. A call-to-action for likes, comments, and subscriptions

Blog Post:
{content}

YouTube Video Details:`,

  newsletter: `Transform the following blog post into a newsletter excerpt (200-300 words). Include:
1. A catchy subject line (50 characters max)
2. A brief introduction
3. Key highlights from the post
4. A "Read More" link
5. A personal sign-off

Blog Post:
{content}

Newsletter:`,

  email: `Transform the following blog post into an email campaign sequence (3 emails). Each email should be 150-250 words.
Email 1: Hook/Teaser
Email 2: Value/Details
Email 3: Call-to-Action

Format each email with Subject line, Body, and CTA button text.

Blog Post:
{content}

Email Campaign:`,

  podcast: `Transform the following blog post into a podcast episode outline (15-20 minutes when spoken). Include:
1. Episode title
2. Hook/Introduction (30 seconds)
3. Main talking points with timestamps
4. Stories or examples to include
5. Call-to-action/Outro

Write in conversational, spoken language.

Blog Post:
{content}

Podcast Outline:`,

  slides: `Transform the following blog post into a slide deck outline (8-12 slides). For each slide, provide:
- Slide number
- Title
- Bullet points (2-3 per slide)
- Speaker notes (1-2 sentences)

Make it visually engaging and suitable for a presentation.

Blog Post:
{content}

Slide Deck:`,
};

/**
 * Get repurposing prompt for a specific format
 */
export function getRepurposingPrompt(format: RepurposingFormat, postContent: string): string {
  const template = repurposingPrompts[format];
  if (!template) {
    throw new Error(`Unknown repurposing format: ${format}`);
  }
  return template.replace("{content}", postContent);
}

/**
 * Get metadata template for a format
 */
export function getFormatMetadata(format: RepurposingFormat, content: string): Record<string, unknown> {
  const charCount = content.length;
  const wordCount = content.split(/\s+/).length;
  const lineCount = content.split("\n").length;

  const baseMetadata = {
    characterCount: charCount,
    wordCount: wordCount,
    lineCount: lineCount,
    generatedAt: new Date().toISOString(),
  };

  switch (format) {
    case "twitter":
      return {
        ...baseMetadata,
        tweetCount: Math.ceil(charCount / 280),
        format: "twitter-thread",
      };
    case "linkedin":
      return {
        ...baseMetadata,
        readingTimeMinutes: Math.ceil(wordCount / 200),
        format: "professional-article",
      };
    case "tiktok":
      return {
        ...baseMetadata,
        estimatedDurationSeconds: Math.ceil(wordCount / 2.5),
        format: "short-form-video",
      };
    case "youtube":
      return {
        ...baseMetadata,
        estimatedDurationMinutes: Math.ceil(wordCount / 130),
        format: "long-form-video",
      };
    case "newsletter":
      return {
        ...baseMetadata,
        readingTimeMinutes: Math.ceil(wordCount / 200),
        format: "newsletter-excerpt",
      };
    case "email":
      return {
        ...baseMetadata,
        emailCount: 3,
        format: "email-sequence",
      };
    case "podcast":
      return {
        ...baseMetadata,
        estimatedDurationMinutes: Math.ceil(wordCount / 130),
        format: "podcast-outline",
      };
    case "slides":
      return {
        ...baseMetadata,
        estimatedSlideCount: Math.ceil(wordCount / 50),
        format: "presentation-deck",
      };
    default:
      return baseMetadata;
  }
}
