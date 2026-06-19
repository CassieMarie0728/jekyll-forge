import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Zap,
  Github,
  FileText,
  Image,
  Cpu,
  GitBranch,
  Shield,
  Palette,
  ArrowRight,
  Check,
  Terminal,
  Globe,
  BookOpen,
  Puzzle,
} from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Github,
    title: "GitHub-Native",
    desc: "Connect your repo, browse files, commit directly via GitHub API. No local setup required.",
  },
  {
    icon: FileText,
    title: "Visual Editor",
    desc: "Three-mode editor: rich visual, raw Markdown, and split preview. Full front matter manager.",
  },
  {
    icon: Image,
    title: "Asset Manager",
    desc: "Drag-and-drop uploads with S3 storage, image optimization, WEBP conversion, and AI alt text.",
  },
  {
    icon: Cpu,
    title: "AI Writing Assistant",
    desc: "Generate titles, outlines, rewrites, SEO meta, tags, and more — all server-side, no key exposure.",
  },
  {
    icon: GitBranch,
    title: "Safe Publishing",
    desc: "Visual diff viewer, validation checklist, branch/PR creation, and scheduled publishing.",
  },
  {
    icon: Shield,
    title: "Crash Recovery",
    desc: "Autosave to IndexedDB, named revision snapshots, and conflict detection against GitHub.",
  },
  {
    icon: Palette,
    title: "Theme Manager",
    desc: "Detect and manage Jekyll themes. Custom CSS overrides with backup before any change.",
  },
  {
    icon: Puzzle,
    title: "Plugin Manager",
    desc: "Add plugins with GitHub Pages compatibility warnings and automatic GitHub Actions generation.",
  },
];

const PLUGIN_WARNING =
  "⚠️ Plugin Warning: GitHub Pages does not support every Jekyll plugin when using the default build process. Jekyll Forge always warns you before adding unsupported plugins and offers to generate a GitHub Actions workflow.";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/repos");
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 forge-glass">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Jekyll Forge
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              Sign In
            </Button>
            <Button
              onClick={() => (window.location.href = getSignUpUrl())}
              size="sm"
              className="gap-2"
            >
              <Github className="w-4 h-4" />
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 text-primary bg-primary/10 px-3 py-1 text-xs"
            >
              Production-Ready Jekyll CMS
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6"
          >
            Your Jekyll site,{" "}
            <span className="forge-text-gradient">forged</span> in the browser.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A full-stack visual CMS for GitHub-hosted Jekyll blogs. Write posts
            visually, manage assets, publish with confidence, and use AI
            assistance — all from your browser, no local setup required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="lg"
              onClick={() => (window.location.href = getSignUpUrl())}
              className="gap-2 text-base h-12 px-8"
            >
              <Github className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base h-12 px-8"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <BookOpen className="w-4 h-4" />
              Sign In
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Plugin Warning Banner */}
      <section className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="plugin-warning text-sm leading-relaxed">
            {PLUGIN_WARNING}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">
              Everything you need to run a Jekyll blog
            </h2>
            <p className="text-muted-foreground">
              Visual enough for writers. Powerful enough for developers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="px-6 py-16 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            From idea to published post in minutes
          </h2>
          <div className="space-y-4">
            {[
              {
                n: "01",
                title: "Connect GitHub",
                desc: "Paste a Personal Access Token. Jekyll Forge connects to your repos instantly.",
              },
              {
                n: "02",
                title: "Select your Jekyll site",
                desc: "Auto-detects Jekyll structure, theme, plugins, and build method.",
              },
              {
                n: "03",
                title: "Write visually or in Markdown",
                desc: "Three editor modes with full front matter management and autosave.",
              },
              {
                n: "04",
                title: "Preview & audit",
                desc: "Multi-viewport preview, SEO audit, accessibility check, and content health report.",
              },
              {
                n: "05",
                title: "Publish safely",
                desc: "Visual diff, validation checklist, commit to branch or create a PR.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-primary">
                    {n}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm mb-0.5">{title}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to forge your Jekyll site?
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your GitHub account and start managing your Jekyll blog from
            the browser.
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getSignUpUrl())}
            className="gap-2 text-base h-12 px-10"
          >
            <Github className="w-5 h-5" />
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" />
          <span>
            Jekyll Forge — A visual CMS for GitHub-hosted Jekyll blogs
          </span>
        </div>
      </footer>
    </div>
  );
}
