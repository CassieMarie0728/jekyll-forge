export type SavedPostContent = {
  title?: string | null;
  markdown?: string | null;
  frontMatter?: Record<string, unknown> | null;
  autosaveContent?: string | null;
  autosaveFrontMatter?: Record<string, unknown> | null;
};
export function restoreSavedPost(post: SavedPostContent) {
  return {
    markdown: post.autosaveContent ?? post.markdown ?? "",
    frontMatter: post.autosaveFrontMatter ??
      post.frontMatter ?? { title: post.title ?? "" },
  };
}
export type PostFile = {
  name: string;
  path: string;
  sha: string;
  folder: string;
};
export function mergePostFiles(
  remote: PostFile[],
  saved: { path: string; title?: string | null; sha?: string | null }[]
): PostFile[] {
  const files = new Map(remote.map(file => [file.path, file]));
  for (const post of saved) {
    if (!files.has(post.path))
      files.set(post.path, {
        path: post.path,
        name: post.title || post.path.split("/").pop() || post.path,
        sha: post.sha || "",
        folder: post.path.includes("_posts/") ? "_posts" : "_drafts",
      });
  }
  return [...files.values()];
}
