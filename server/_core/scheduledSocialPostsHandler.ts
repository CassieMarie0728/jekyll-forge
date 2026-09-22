import { and, eq, lte } from "drizzle-orm";
import { getDb, getSocialMediaAccount, updateScheduledSocialPost } from "../db";
import { scheduledSocialPosts } from "../../drizzle/schema";
import { TwitterService, LinkedInService } from "./socialMediaService";
import { notifyOwner } from "./notification";

// Never retry a social write automatically after an ambiguous network failure:
// the provider may already have accepted it.
export async function processPendingScheduledSocialPosts() {
  const database = await getDb();
  const due = await database
    .select()
    .from(scheduledSocialPosts)
    .where(
      and(
        eq(scheduledSocialPosts.status, "pending"),
        lte(scheduledSocialPosts.scheduledAt, new Date())
      )
    )
    .limit(2);
  for (const post of due) {
    const claimed = await database
      .update(scheduledSocialPosts)
      .set({ status: "processing" })
      .where(
        and(
          eq(scheduledSocialPosts.id, post.id),
          eq(scheduledSocialPosts.status, "pending")
        )
      )
      .returning({ id: scheduledSocialPosts.id });
    if (!claimed.length) continue;
    try {
      const account = await getSocialMediaAccount(
        post.socialMediaAccountId,
        post.userId
      );
      if (
        !account ||
        !account.isConnected ||
        (account.expiresAt && account.expiresAt <= new Date())
      ) {
        throw new Error("Reconnect this social account before publishing");
      }
      let result;
      if (account.platform === "twitter") {
        result = await new TwitterService(account.accessToken).postTweet(
          post.content
        );
      } else if (account.platform === "linkedin") {
        const [title, ...body] = post.content.split("\n");
        result = await new LinkedInService(account.accessToken).postArticle(
          title,
          body.join("\n")
        );
      } else {
        throw new Error(
          "This platform needs a verified media/page publishing integration before scheduled publishing is available"
        );
      }
      if (!result.success || !result.externalPostId)
        throw new Error(
          "No publication receipt returned; verify the platform before retrying"
        );
      await updateScheduledSocialPost(post.id, post.userId, {
        status: "published",
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
        publishedAt: new Date(),
        errorMessage: null,
      });
    } catch {
      const message =
        "Publishing could not be confirmed. Check the social platform before retrying to avoid duplicate posts.";
      await updateScheduledSocialPost(post.id, post.userId, {
        status: "failed",
        errorMessage: message,
      });
      await notifyOwner({
        title: "Social publishing needs attention",
        content: `Schedule ${post.id}: ${message}`,
      });
    }
  }
  await database
    .update(scheduledSocialPosts)
    .set({
      status: "failed",
      errorMessage:
        "Publishing interrupted; verify the platform before retrying.",
    })
    .where(
      and(
        eq(scheduledSocialPosts.status, "processing"),
        lte(scheduledSocialPosts.updatedAt, new Date(Date.now() - 15 * 60000))
      )
    );
}
