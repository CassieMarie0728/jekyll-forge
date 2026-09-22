import { load, dump, JSON_SCHEMA } from "js-yaml";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getUserByOpenId, upsertUser } from "../db";
import { GITHUB_PAGES_SUPPORTED_PLUGINS } from "../../shared/types";

type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  content: string;
  type: string;
  download_url: string | null;
};
type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  default_branch: string;
  owner: { login: string; avatar_url: string };
  html_url: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
};
type GitHubCommit = {
  content: { sha: string } | null;
  commit: { html_url: string; sha: string };
};
const GITHUB_API = "https://api.github.com";

export function githubApiErrorForStatus(status: number) {
  if (status === 401) {
    return new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "GitHub authorization failed. Reconnect your GitHub account and try again.",
    });
  }

  if (status === 403) {
    return new TRPCError({
      code: "FORBIDDEN",
      message:
        "GitHub denied this request. Check the connected account permissions and repository access.",
    });
  }

  if (status === 409 || status === 422)
    return new TRPCError({
      code: "CONFLICT",
      message:
        "GitHub could not apply these changes. The file or branch may have changed, or the destination is invalid. Refresh the publishing review and check the branch name before retrying.",
    });

  if (status === 404) {
    return new TRPCError({
      code: "NOT_FOUND",
      message:
        "The requested GitHub resource was not found or is no longer available.",
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "GitHub could not complete this request. Please try again.",
  });
}

async function ghFetch<T = GitHubFile>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Jekyll-Forge",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    throw githubApiErrorForStatus(res.status);
  }
  return res.json() as Promise<T>;
}

async function getGitHubToken(userId: number, openId: string): Promise<string> {
  const user = await getUserByOpenId(openId);
  if (!user?.githubToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "GitHub not connected. Please connect your GitHub account.",
    });
  }
  return user.githubToken;
}

export const githubRouter = router({
  // Connect GitHub with a Personal Access Token
  connect: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Verify token works
      const ghUser = await ghFetch<{
        login: string;
        avatar_url: string;
        id: number;
      }>(input.token, "/user");
      await upsertUser({
        openId: ctx.user.openId,
        githubToken: input.token,
        githubLogin: ghUser.login,
        githubAvatarUrl: ghUser.avatar_url,
        githubId: String(ghUser.id),
      });
      return {
        login: ghUser.login,
        avatarUrl: ghUser.avatar_url,
        id: ghUser.id,
      };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await upsertUser({
      openId: ctx.user.openId,
      githubToken: null as unknown as string,
      githubLogin: null as unknown as string,
      githubAvatarUrl: null as unknown as string,
      githubId: null as unknown as string,
    });
    return { success: true };
  }),

  status: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserByOpenId(ctx.user.openId);
    return {
      connected: !!user?.githubToken,
      login: user?.githubLogin,
      avatarUrl: user?.githubAvatarUrl,
    };
  }),

  // Cursor pages let the picker search every accessible repository without
  // collecting an unbounded number of GitHub requests in one Worker invocation.
  repositories: protectedProcedure
    .input(z.object({ cursor: z.number().int().min(1).nullish() }))
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const page = input.cursor ?? 1;
      const items = await ghFetch<GitHubRepo[]>(
        token,
        `/user/repos?sort=full_name&direction=asc&per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`
      );
      return { items, nextCursor: items.length === 100 ? page + 1 : undefined };
    }),

  listRepos: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        perPage: z.number().default(30),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const repos = await ghFetch<GitHubRepo[]>(
        token,
        `/user/repos?sort=updated&per_page=${input.perPage}&page=${input.page}&affiliation=owner,collaborator,organization_member`
      );
      let filtered = repos;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = repos.filter(
          (r: { name: string; full_name: string; description?: string }) =>
            r.name.toLowerCase().includes(q) ||
            r.full_name.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }),

  detectJekyll: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        branch: z.string().default("main"),
        rootPath: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const root = input.rootPath ? input.rootPath.replace(/^\//, "") : "";
      const prefix = root ? `${root}/` : "";

      const checkFile = async (path: string) => {
        try {
          await ghFetch(
            token,
            `/repos/${input.owner}/${input.repo}/contents/${prefix}${path}?ref=${encodeURIComponent(input.branch)}`
          );
          return true;
        } catch {
          return false;
        }
      };

      const [
        hasConfig,
        hasPosts,
        hasDrafts,
        hasLayouts,
        hasIncludes,
        hasSass,
        hasData,
        hasAssets,
        hasGemfile,
      ] = await Promise.all([
        checkFile("_config.yml"),
        checkFile("_posts"),
        checkFile("_drafts"),
        checkFile("_layouts"),
        checkFile("_includes"),
        checkFile("_sass"),
        checkFile("_data"),
        checkFile("assets"),
        checkFile("Gemfile"),
      ]);

      // Try to read config for theme/plugins
      let detectedTheme: string | undefined;
      const detectedPlugins: string[] = [];
      let buildMethod: "github-pages" | "github-actions" | "unknown" =
        "unknown";

      if (hasConfig) {
        try {
          const configFile = await ghFetch(
            token,
            `/repos/${input.owner}/${input.repo}/contents/${prefix}_config.yml?ref=${encodeURIComponent(input.branch)}`
          );
          const content = Buffer.from(configFile.content, "base64").toString(
            "utf-8"
          );
          const themeMatch = content.match(/^(?:remote_)?theme:\s*(.+)$/m);
          if (themeMatch) detectedTheme = themeMatch[1].trim();
          const pluginMatches = Array.from(
            content.matchAll(/^\s*-\s*(jekyll-[\w-]+)/gm)
          );
          for (const m of pluginMatches) detectedPlugins.push(m[1]);
        } catch {
          /* ignore */
        }
      }

      // Check for GitHub Actions workflow
      try {
        const workflows = await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/contents/.github/workflows?ref=${encodeURIComponent(input.branch)}`
        );
        if (Array.isArray(workflows) && workflows.length > 0)
          buildMethod = "github-actions";
        else buildMethod = "github-pages";
      } catch {
        buildMethod = "github-pages";
      }

      const isJekyll = hasConfig || hasPosts;
      return {
        isJekyll,
        hasConfig,
        hasPosts,
        hasDrafts,
        hasLayouts,
        hasIncludes,
        hasSass,
        hasData,
        hasAssets,
        hasGemfile,
        detectedTheme,
        detectedPlugins,
        buildMethod,
      };
    }),

  listBranches: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      return ghFetch<Array<{ name: string; commit: { sha: string } }>>(
        token,
        `/repos/${input.owner}/${input.repo}/branches?per_page=50`
      );
    }),

  createBranch: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        branchName: z.string(),
        fromBranch: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const ref = await ghFetch<{ object: { sha: string } }>(
        token,
        `/repos/${input.owner}/${input.repo}/git/ref/heads/${input.fromBranch}`
      );
      return ghFetch(token, `/repos/${input.owner}/${input.repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${input.branchName}`,
          sha: ref.object.sha,
        }),
      });
    }),

  listFiles: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string().default(""),
        branch: z.string().default("main"),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const pathPart = input.path
        ? `/${input.path.split("/").map(encodeURIComponent).join("/")}`
        : "";
      try {
        const result = await ghFetch<GitHubFile[]>(
          token,
          `/repos/${input.owner}/${input.repo}/contents${pathPart}?ref=${encodeURIComponent(input.branch)}`
        );
        return Array.isArray(result) ? result : [];
      } catch (error) {
        if (
          !(error instanceof TRPCError) ||
          error.code !== "NOT_FOUND" ||
          !input.path
        )
          throw error;
        // A missing folder is empty only after verifying repository and branch access.
        await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/branches/${encodeURIComponent(input.branch)}`
        );
        return [];
      }
    }),

  getFile: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        branch: z.string().default("main"),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const file = await ghFetch(
        token,
        `/repos/${input.owner}/${input.repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(input.branch)}`
      );
      const content = Buffer.from(file.content, "base64").toString("utf-8");
      return { ...file, decodedContent: content };
    }),

  inventory: protectedProcedure
    .input(
      z.object({ owner: z.string(), repo: z.string(), branch: z.string() })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const result = await ghFetch<{
        truncated: boolean;
        tree: { path: string; type: string; size?: number }[];
      }>(
        token,
        `/repos/${input.owner}/${input.repo}/git/trees/${encodeURIComponent(input.branch)}?recursive=1`
      );
      return {
        truncated: result.truncated,
        files: result.tree
          .filter(file => file.type === "blob")
          .map(({ path, size }) => ({ path, size })),
      };
    }),

  reviewFile: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        branch: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      try {
        const file = await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(input.branch)}`
        );
        if (file.type !== "file" || typeof file.content !== "string")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot review this destination as a text file.",
          });
        return {
          sha: file.sha,
          content: Buffer.from(file.content, "base64").toString("utf-8"),
        };
      } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "NOT_FOUND")
          throw error;
        await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/branches/${encodeURIComponent(input.branch)}`
        );
        return { sha: undefined, content: "" };
      }
    }),

  commitFile: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        branch: z.string(),
        content: z.string(),
        message: z.string(),
        sha: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const encoded = Buffer.from(input.content).toString("base64");
      const body: Record<string, unknown> = {
        message: input.message,
        content: encoded,
        branch: input.branch,
      };
      if (input.sha) body.sha = input.sha;
      return ghFetch<GitHubCommit>(
        token,
        `/repos/${input.owner}/${input.repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );
    }),

  deleteFile: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        branch: z.string(),
        sha: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      return ghFetch(
        token,
        `/repos/${input.owner}/${input.repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            message: input.message,
            sha: input.sha,
            branch: input.branch,
          }),
        }
      );
    }),

  createPullRequest: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        head: z.string(),
        base: z.string(),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      return ghFetch<{ number: number; html_url: string }>(
        token,
        `/repos/${input.owner}/${input.repo}/pulls`,
        {
          method: "POST",
          body: JSON.stringify({
            title: input.title,
            head: input.head,
            base: input.base,
            body: input.body || "",
          }),
        }
      );
    }),

  getRateLimit: protectedProcedure.query(async ({ ctx }) => {
    const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
    return ghFetch<{
      rate: { remaining: number; limit: number; reset: number };
    }>(token, "/rate_limit");
  }),

  getPagesStatus: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      try {
        return await ghFetch<{ status: string; html_url: string }>(
          token,
          `/repos/${input.owner}/${input.repo}/pages`
        );
      } catch {
        return null;
      }
    }),

  checkPluginCompatibility: protectedProcedure
    .input(z.object({ plugin: z.string() }))
    .query(({ input }) => {
      const supported = (
        GITHUB_PAGES_SUPPORTED_PLUGINS as readonly string[]
      ).includes(input.plugin);
      return {
        plugin: input.plugin,
        supported,
        warning: !supported
          ? `⚠️ Plugin Warning: "${input.plugin}" is NOT supported by GitHub Pages' default build process. Your site may fail to build unless you use GitHub Actions or another custom build workflow.`
          : null,
      };
    }),

  /**
   * Update _config.yml to change the theme or add/remove a plugin.
   * Reads the current file, patches the relevant lines, and commits back.
   */
  updateJekyllConfig: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        rootPath: z.string().default(""),
        branch: z.string().default("main"),
        /** Set a new theme */
        theme: z
          .string()
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
          .optional(),
        /** Add a plugin (appended to plugins list) */
        addPlugin: z
          .string()
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
          .optional(),
        /** Remove a plugin */
        removePlugin: z
          .string()
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
          .optional(),
        commitMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const root = input.rootPath.replace(/^\/+|\/+$/g, "");
      if (
        root.split("/").some(part => part === ".." || part === ".") ||
        /[?#\\]/.test(root)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid site root path.",
        });
      const configPath = [root, "_config.yml"]
        .filter(Boolean)
        .map(part => part.split("/").map(encodeURIComponent).join("/"))
        .join("/");

      // Fetch current _config.yml
      let currentContent = "";
      let sha: string | undefined;
      try {
        const file = await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/contents/${configPath}?ref=${encodeURIComponent(input.branch)}`
        );
        currentContent = Buffer.from(file.content, "base64").toString("utf-8");
        sha = file.sha;
      } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "NOT_FOUND")
          throw error;
        await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/branches/${encodeURIComponent(input.branch)}`
        );
      }
      let config: Record<string, unknown>;
      try {
        const parsed = load(currentContent, { schema: JSON_SCHEMA });
        if (
          parsed != null &&
          (typeof parsed !== "object" || Array.isArray(parsed))
        )
          throw new Error();
        config = (parsed || {}) as Record<string, unknown>;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The existing _config.yml contains invalid YAML. Fix it before changing themes or plugins.",
        });
      }
      if (input.theme) {
        config.theme = input.theme;
        delete config.remote_theme;
      }
      if (input.addPlugin || input.removePlugin) {
        if (
          config.plugins != null &&
          (!Array.isArray(config.plugins) ||
            config.plugins.some(value => typeof value !== "string"))
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The plugins field must be a YAML list of plugin names.",
          });
        const plugins = (config.plugins || []) as string[];
        config.plugins = [
          ...new Set([
            ...plugins.filter(value => value !== input.removePlugin),
            ...(input.addPlugin ? [input.addPlugin] : []),
          ]),
        ];
      }
      const updatedContent = dump(config, {
        schema: JSON_SCHEMA,
        noRefs: true,
        lineWidth: -1,
      });

      const commitMsg =
        input.commitMessage ||
        (input.theme
          ? `chore: update Jekyll theme to ${input.theme}`
          : input.addPlugin
            ? `chore: add Jekyll plugin ${input.addPlugin}`
            : `chore: remove Jekyll plugin ${input.removePlugin}`);

      const encoded = Buffer.from(updatedContent).toString("base64");
      const body: Record<string, unknown> = {
        message: commitMsg,
        content: encoded,
        branch: input.branch,
      };
      if (sha) body.sha = sha;

      await ghFetch(
        token,
        `/repos/${input.owner}/${input.repo}/contents/${configPath}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );

      return { success: true, updatedContent };
    }),

  getJekyllConfig: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        rootPath: z.string().default(""),
        branch: z.string().default("main"),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      const root = input.rootPath.replace(/^\/+|\/+$/g, "");
      if (
        root.split("/").some(part => part === ".." || part === ".") ||
        /[?#\\]/.test(root)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid site root path.",
        });
      const configPath = [root, "_config.yml"]
        .filter(Boolean)
        .map(part => part.split("/").map(encodeURIComponent).join("/"))
        .join("/");
      try {
        const file = await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/contents/${configPath}?ref=${encodeURIComponent(input.branch)}`
        );
        const content = Buffer.from(file.content, "base64").toString("utf-8");
        const config = load(content, { schema: JSON_SCHEMA });
        if (!config || typeof config !== "object" || Array.isArray(config))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid Jekyll YAML configuration.",
          });
        return config as Record<string, unknown>;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot parse _config.yml. Check its YAML formatting.",
        });
      }
    }),

  generateActionsWorkflow: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        branch: z.string().default("main"),
      })
    )
    .mutation(({ input }) => {
      return {
        path: ".github/workflows/jekyll.yml",
        content: `name: Deploy Jekyll site to Pages

on:
  push:
    branches: [${JSON.stringify(input.branch)}]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
      - name: Build with Jekyll
        run: bundle exec jekyll build --baseurl "\${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: production
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`,
      };
    }),
});
