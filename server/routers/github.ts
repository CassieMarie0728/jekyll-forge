import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getUserByOpenId, upsertUser } from "../db";
import { GITHUB_PAGES_SUPPORTED_PLUGINS } from "../../shared/types";

const GITHUB_API = "https://api.github.com";

async function ghFetch(token: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new TRPCError({
      code:
        res.status === 401
          ? "UNAUTHORIZED"
          : res.status === 403
            ? "FORBIDDEN"
            : res.status === 404
              ? "NOT_FOUND"
              : "INTERNAL_SERVER_ERROR",
      message: body.message || `GitHub API error: ${res.status}`,
    });
  }
  return res.json();
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
      const ghUser = await ghFetch(input.token, "/user");
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
      const repos = await ghFetch(
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
            `/repos/${input.owner}/${input.repo}/contents/${prefix}${path}?ref=${input.branch}`
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
            `/repos/${input.owner}/${input.repo}/contents/${prefix}_config.yml?ref=${input.branch}`
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
          `/repos/${input.owner}/${input.repo}/contents/.github/workflows?ref=${input.branch}`
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
      return ghFetch(
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
      const ref = await ghFetch(
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
      const pathPart = input.path ? `/${input.path}` : "";
      return ghFetch(
        token,
        `/repos/${input.owner}/${input.repo}/contents${pathPart}?ref=${input.branch}`
      );
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
        `/repos/${input.owner}/${input.repo}/contents/${input.path}?ref=${input.branch}`
      );
      const content = Buffer.from(file.content, "base64").toString("utf-8");
      return { ...file, decodedContent: content };
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
      return ghFetch(
        token,
        `/repos/${input.owner}/${input.repo}/contents/${input.path}`,
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
        `/repos/${input.owner}/${input.repo}/contents/${input.path}`,
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
      return ghFetch(token, `/repos/${input.owner}/${input.repo}/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          head: input.head,
          base: input.base,
          body: input.body || "",
        }),
      });
    }),

  getRateLimit: protectedProcedure.query(async ({ ctx }) => {
    const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
    return ghFetch(token, "/rate_limit");
  }),

  getPagesStatus: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      try {
        return await ghFetch(
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
        branch: z.string().default("main"),
        /** Set a new theme */
        theme: z.string().optional(),
        /** Add a plugin (appended to plugins list) */
        addPlugin: z.string().optional(),
        /** Remove a plugin */
        removePlugin: z.string().optional(),
        commitMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);

      // Fetch current _config.yml
      let currentContent = "";
      let sha: string | undefined;
      try {
        const file = await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/contents/_config.yml?ref=${input.branch}`
        );
        currentContent = Buffer.from(file.content, "base64").toString("utf-8");
        sha = file.sha;
      } catch {
        // File doesn't exist yet — start with empty content
        currentContent = "";
      }

      let updatedContent = currentContent;

      // Update theme
      if (input.theme) {
        if (/^theme:/m.test(updatedContent)) {
          updatedContent = updatedContent.replace(
            /^theme:.*$/m,
            `theme: ${input.theme}`
          );
        } else {
          updatedContent = `theme: ${input.theme}\n` + updatedContent;
        }
      }

      // Add plugin
      if (input.addPlugin) {
        const plugin = input.addPlugin;
        if (!updatedContent.includes(plugin)) {
          if (/^plugins:/m.test(updatedContent)) {
            // Append to existing plugins list
            updatedContent = updatedContent.replace(
              /^(plugins:\s*\n(?:(?:\s+-\s+.+\n)*))/m,
              match => match.trimEnd() + `\n  - ${plugin}\n`
            );
          } else {
            // Add plugins section at end
            updatedContent =
              updatedContent.trimEnd() + `\n\nplugins:\n  - ${plugin}\n`;
          }
        }
      }

      // Remove plugin
      if (input.removePlugin) {
        const plugin = input.removePlugin;
        updatedContent = updatedContent.replace(
          new RegExp(
            `^\\s*-\\s*${plugin.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*$`,
            "gm"
          ),
          ""
        );
      }

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
        `/repos/${input.owner}/${input.repo}/contents/_config.yml`,
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
        branch: z.string().default("main"),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = await getGitHubToken(ctx.user.id, ctx.user.openId);
      try {
        const file = await ghFetch(
          token,
          `/repos/${input.owner}/${input.repo}/contents/_config.yml?ref=${input.branch}`
        );
        const content = Buffer.from(file.content, "base64").toString("utf-8");
        const config: Record<string, unknown> = {};
        for (const line of content.split("\n")) {
          const colonIdx = line.indexOf(":");
          if (colonIdx === -1 || line.startsWith("#")) continue;
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          if (!key) continue;
          config[key] = val.replace(/^["']|["']$/g, "");
        }
        // Parse plugins array
        const pluginMatches = Array.from(
          content.matchAll(/^\s*-\s*(jekyll-[\w-]+)/gm)
        );
        config.plugins = pluginMatches.map(m => m[1]);
        return config;
      } catch {
        return {};
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
    branches: ["${input.branch}"]
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
