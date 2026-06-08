import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  createRepurposedContent,
  getRepurposedContentByPostId,
  getRepurposedContentById,
  updateRepurposedContent,
  deleteRepurposedContent,
} from "./db";
import { getRepurposingPrompt, getFormatMetadata } from "./repurposingPrompts";

describe("Repurposing Prompts", () => {
  it("should generate Twitter repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("twitter", content);
    expect(prompt).toContain("Twitter thread");
    expect(prompt).toContain(content);
    expect(prompt).toContain("280 characters");
  });

  it("should generate LinkedIn repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("linkedin", content);
    expect(prompt).toContain("LinkedIn article");
    expect(prompt).toContain("professional");
    expect(prompt).toContain(content);
  });

  it("should generate TikTok repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("tiktok", content);
    expect(prompt).toContain("TikTok");
    expect(prompt).toContain("30-60 seconds");
    expect(prompt).toContain(content);
  });

  it("should generate YouTube repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("youtube", content);
    expect(prompt).toContain("YouTube");
    expect(prompt).toContain("description");
    expect(prompt).toContain("timestamps");
    expect(prompt).toContain(content);
  });

  it("should generate newsletter repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("newsletter", content);
    expect(prompt).toContain("newsletter");
    expect(prompt).toContain("subject line");
    expect(prompt).toContain(content);
  });

  it("should generate email repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("email", content);
    expect(prompt).toContain("email campaign");
    expect(prompt).toContain("3 emails");
    expect(prompt).toContain(content);
  });

  it("should generate podcast repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("podcast", content);
    expect(prompt).toContain("podcast");
    expect(prompt).toContain("15-20 minutes");
    expect(prompt).toContain("spoken language");
    expect(prompt).toContain(content);
  });

  it("should generate slides repurposing prompt", () => {
    const content = "This is a test blog post about web development.";
    const prompt = getRepurposingPrompt("slides", content);
    expect(prompt).toContain("slide deck");
    expect(prompt).toContain("8-12 slides");
    expect(prompt).toContain(content);
  });

  it("should throw error for unknown format", () => {
    const content = "This is a test blog post.";
    expect(() => getRepurposingPrompt("unknown" as any, content)).toThrow();
  });
});

describe("Format Metadata", () => {
  it("should generate Twitter metadata", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("twitter", content);
    expect(metadata.characterCount).toBe(content.length);
    expect(metadata.wordCount).toBeGreaterThan(0);
    expect(metadata.tweetCount).toBeGreaterThan(0);
    expect(metadata.format).toBe("twitter-thread");
  });

  it("should generate LinkedIn metadata", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("linkedin", content);
    expect(metadata.characterCount).toBe(content.length);
    expect(metadata.readingTimeMinutes).toBeGreaterThan(0);
    expect(metadata.format).toBe("professional-article");
  });

  it("should generate TikTok metadata", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("tiktok", content);
    expect(metadata.estimatedDurationSeconds).toBeGreaterThan(0);
    expect(metadata.format).toBe("short-form-video");
  });

  it("should generate YouTube metadata", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("youtube", content);
    expect(metadata.estimatedDurationMinutes).toBeGreaterThan(0);
    expect(metadata.format).toBe("long-form-video");
  });

  it("should generate email metadata with 3 emails", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("email", content);
    expect(metadata.emailCount).toBe(3);
    expect(metadata.format).toBe("email-sequence");
  });

  it("should generate podcast metadata", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("podcast", content);
    expect(metadata.estimatedDurationMinutes).toBeGreaterThan(0);
    expect(metadata.format).toBe("podcast-outline");
  });

  it("should generate slides metadata", () => {
    const content = "This is a test blog post about web development. It has multiple sentences.";
    const metadata = getFormatMetadata("slides", content);
    expect(metadata.estimatedSlideCount).toBeGreaterThan(0);
    expect(metadata.format).toBe("presentation-deck");
  });

  it("should include generatedAt timestamp", () => {
    const content = "This is a test blog post.";
    const metadata = getFormatMetadata("twitter", content);
    expect(metadata.generatedAt).toBeDefined();
    expect(typeof metadata.generatedAt).toBe("string");
  });

  it("should calculate word count correctly", () => {
    const content = "One two three four five";
    const metadata = getFormatMetadata("twitter", content);
    expect(metadata.wordCount).toBe(5);
  });
});

describe.skip("Database Operations", () => {
  const testData = {
    userId: 999,
    siteId: 999,
    postId: 999,
    postTitle: "Test Post",
    postSlug: "test-post",
    format: "twitter" as const,
    content: "Generated Twitter thread content",
    metadata: { tweetCount: 5 },
    isCustomized: false,
    status: "generated" as const,
  };

  it("should create repurposed content", async () => {
    const id = await createRepurposedContent(testData);
    expect(id).toBeGreaterThan(0);
  });

  it("should retrieve repurposed content by post ID", async () => {
    const id = await createRepurposedContent(testData);
    const results = await getRepurposedContentByPostId(testData.postId, testData.userId);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === id)).toBe(true);
  });

  it("should retrieve repurposed content by ID", async () => {
    const id = await createRepurposedContent(testData);
    const result = await getRepurposedContentById(id, testData.userId);
    expect(result).toBeDefined();
    expect(result?.id).toBe(id);
    expect(result?.content).toBe(testData.content);
    expect(result?.format).toBe("twitter");
  });

  it("should update repurposed content", async () => {
    const id = await createRepurposedContent(testData);
    const updatedContent = "Updated Twitter thread content";
    await updateRepurposedContent(id, testData.userId, {
      content: updatedContent,
      isCustomized: true,
      status: "approved",
    });
    const result = await getRepurposedContentById(id, testData.userId);
    expect(result?.content).toBe(updatedContent);
    expect(result?.isCustomized).toBe(true);
    expect(result?.status).toBe("approved");
  });

  it("should delete repurposed content", async () => {
    const id = await createRepurposedContent(testData);
    await deleteRepurposedContent(id, testData.userId);
    const result = await getRepurposedContentById(id, testData.userId);
    expect(result).toBeUndefined();
  });

  it("should not retrieve content for different user", async () => {
    const id = await createRepurposedContent(testData);
    const result = await getRepurposedContentById(id, 9999); // Different user
    expect(result).toBeUndefined();
  });

  it("should handle multiple formats for same post", async () => {
    const twitterData = { ...testData, format: "twitter" as const };
    const linkedinData = { ...testData, format: "linkedin" as const, content: "LinkedIn article" };

    const twitterId = await createRepurposedContent(twitterData);
    const linkedinId = await createRepurposedContent(linkedinData);

    const results = await getRepurposedContentByPostId(testData.postId, testData.userId);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some((r) => r.id === twitterId && r.format === "twitter")).toBe(true);
    expect(results.some((r) => r.id === linkedinId && r.format === "linkedin")).toBe(true);
  });
});
