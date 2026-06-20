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
  Smartphone,
  Share2,
  BarChart3,
  Clock,
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
  {
    icon: Smartphone,
    title: "Native Android App",
    desc: "Manage your content on-the-go with a full-featured React Native mobile app. Edit, preview, and publish from anywhere.",
  },
  {
    icon: Share2,
    title: "Social Media Repurposing",
    desc: "Automatically adapt content for Twitter, LinkedIn, Facebook, Instagram. Schedule posts and track engagement across platforms.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track post performance, engagement metrics, and audience insights. Real-time analytics from all social platforms.",
  },
  {
    icon: Clock,
    title: "Scheduled Publishing",
    desc: "Schedule posts for optimal times with automatic retry logic, rate limit handling, and comprehensive error recovery.",
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
              Production-Ready CMS + Mobile App + Social Media
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6"
          >
            Your Jekyll site,{" "}
            <span className="forge-text-gradient">forged</span> everywhere.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A full-stack visual CMS for GitHub-hosted Jekyll blogs with native
            mobile app. Write posts visually, repurpose for social media, publish
            with confidence, and use AI assistance — all from your browser or
            phone, no local setup required.
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
              Everything you need to run a Jekyll blog + social media
            </h2>
            <p className="text-muted-foreground">
              Visual enough for writers. Powerful enough for developers. Mobile-first for creators.
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
                desc: "Three editor modes with full front matter management and autosave. Works on desktop and mobile.",
              },
              {
                n: "04",
                title: "Repurpose for social media",
                desc: "Automatically adapt content for Twitter, LinkedIn, Facebook, Instagram with platform-specific optimization.",
              },
              {
                n: "05",
                title: "Schedule & publish",
                desc: "Schedule posts for optimal times with automatic retry logic, rate limit handling, and comprehensive error recovery.",
              },
              {
                n: "06",
                title: "Track analytics",
                desc: "Monitor post performance and engagement metrics across all platforms in real-time.",
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

      {/* Integrations Showcase */}
      <section className="px-6 py-16 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">
              Seamless integrations with your favorite tools
            </h2>
            <p className="text-muted-foreground">
              Connect Jekyll Forge to your existing workflow and watch your content flow across all platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GitHub Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Github className="w-5 h-5 text-white dark:text-black" />
                </div>
                <h3 className="font-semibold">GitHub</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Direct repository access with commit, branch, and PR creation. Real-time sync with your GitHub repos.
              </p>
              <div className="text-xs font-mono bg-muted p-3 rounded text-muted-foreground">
                <div>Your Jekyll repo</div>
                <div className="text-primary">↓ Read/Write via API ↓</div>
                <div>Jekyll Forge</div>
              </div>
            </motion.div>

            {/* Social Platforms Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Social Media</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Publish to Twitter, LinkedIn, Facebook, Instagram. Auto-adapt content per platform with scheduling.
              </p>
              <div className="text-xs font-mono bg-muted p-3 rounded text-muted-foreground">
                <div>Your content</div>
                <div className="text-primary">↓ Repurpose & Schedule ↓</div>
                <div>All social platforms</div>
              </div>
            </motion.div>

            {/* Analytics Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Analytics</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time engagement metrics from all platforms. Track impressions, clicks, and audience growth.
              </p>
              <div className="text-xs font-mono bg-muted p-3 rounded text-muted-foreground">
                <div>Social platforms</div>
                <div className="text-primary">↓ Aggregate metrics ↓</div>
                <div>Jekyll Forge dashboard</div>
              </div>
            </motion.div>
          </div>

          {/* Data Flow Diagram */}
          <div className="mt-12 p-8 bg-background border border-border rounded-xl">
            <h3 className="font-semibold text-center mb-8">Complete Data Flow</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <Github className="w-6 h-6 text-white dark:text-black" />
                </div>
                <div className="font-semibold">GitHub</div>
                <div className="text-xs text-muted-foreground">Source of truth</div>
              </div>
              <div className="hidden md:block text-muted-foreground">→</div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="font-semibold">Jekyll Forge</div>
                <div className="text-xs text-muted-foreground">Content hub</div>
              </div>
              <div className="hidden md:block text-muted-foreground">→</div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-2">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold">Social Media</div>
                <div className="text-xs text-muted-foreground">Audience reach</div>
              </div>
              <div className="hidden md:block text-muted-foreground">→</div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold">Analytics</div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Highlight */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold mb-2">
                  Manage your content on-the-go
                </h3>
                <p className="text-muted-foreground">
                  Native Android app with full editing capabilities, real-time sync, and offline support.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Edit posts with visual and Markdown editors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Preview content on multiple platforms</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Schedule and publish to social media</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Track analytics and engagement metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Offline mode with automatic sync</span>
              </li>
            </ul>
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
            the browser or mobile app.
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
            Jekyll Forge — Visual CMS + Mobile App + Social Media Management
          </span>
        </div>
      </footer>
    </div>
  );
}
