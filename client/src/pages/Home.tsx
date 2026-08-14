import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { useLocation } from "wouter";
import React, { useEffect } from "react";
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
  ChevronDown,
  Play,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  LineChart,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FEATURES = [
  {
    icon: Github,
    title: "GitHub-Native",
    desc: "Connect a supported repository, browse files, and commit directly through the GitHub API.",
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
    desc: "An Android companion app is in active release validation, with editor, repurposing, scheduling, and analytics screens under test.",
  },
  {
    icon: Share2,
    title: "Social Media Repurposing",
    desc: "Adapt content for connected Twitter, LinkedIn, Facebook, and Instagram accounts, then review available publishing and engagement data.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Review available post-performance and engagement data for connected social accounts from one workspace.",
  },
  {
    icon: Clock,
    title: "Scheduled Publishing",
    desc: "Schedule posts for optimal times with automatic retry logic, rate limit handling, and comprehensive error recovery.",
  },
];

const PLUGIN_WARNING =
  "⚠️ Plugin Warning: GitHub Pages does not support every Jekyll plugin when using the default build process. Jekyll Forge always warns you before adding unsupported plugins and offers to generate a GitHub Actions workflow.";

const FAQ_ITEMS = [
  {
    question: "How do I connect my GitHub repository?",
    answer:
      "Use Jekyll Forge’s supported GitHub connection flow, then choose a repository for the workspace. The app detects common Jekyll structure after it can read the repository.",
  },
  {
    question: "What are the social media posting limits?",
    answer:
      "Posting remains subject to each platform’s account permissions and API limits. Jekyll Forge records failures and applies retry or backoff behavior where the connected platform supports it.",
  },
  {
    question: "When will the Android app be available?",
    answer:
      "The Android companion app is in active production validation. It is not currently presented as a public Google Play release while authentication, synchronization, and release configuration are being finalized.",
  },
  {
    question: "Is pricing available?",
    answer:
      "The product does not currently expose a paid-plan checkout or subscription management flow. Pricing and packaging will be published only when those capabilities are configured.",
  },
  {
    question: "Can I use Jekyll Forge with custom Jekyll themes?",
    answer:
      "Absolutely! Jekyll Forge auto-detects your theme and plugins. You can customize CSS and manage theme settings directly from the editor without breaking your site.",
  },
  {
    question: "How is my content secured?",
    answer:
      "Your source content remains in the connected GitHub repository. Jekyll Forge uses authenticated sessions for access; connected social accounts require server-side credentials, so review account connections and permissions before enabling publishing.",
  },
];

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
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 -right-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Jekyll CMS, GitHub workflow, and social publishing tools
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-8 leading-[1.1]"
          >
            A <span className="forge-text-gradient">content engine</span>
            <br className="hidden md:block" /> for Jekyll blogs.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Write visually, repurpose for social media with AI, and publish from
            anywhere with the companion app currently in release validation.
            Keep your GitHub repository at the center of a coordinated
            publishing workflow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={() => (window.location.href = getSignUpUrl())}
              className="gap-2 text-lg h-14 px-10 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
            >
              <Github className="w-5 h-5" />
              Start Forging Free
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-lg h-14 px-10 bg-background/50 backdrop-blur-sm hover:bg-accent transition-all"
              onClick={() => {
                const demoSection =
                  document.getElementById("workflow-overview");
                const prefersReducedMotion = window.matchMedia(
                  "(prefers-reduced-motion: reduce)"
                ).matches;
                demoSection?.scrollIntoView({
                  behavior: prefersReducedMotion ? "auto" : "smooth",
                });
              }}
            >
              <Play className="w-5 h-5" />
              See Workflow
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> No payment setup
              required to explore
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> Connect a supported
              repository
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> Keep your source
              content in GitHub
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product focus */}
      <section className="py-12 border-y border-border bg-card/20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-8">
            Built around GitHub-backed Jekyll workflows
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-70 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center justify-center gap-2 font-display font-bold text-xl">
              <Github className="w-6 h-6" /> GitHub Pages
            </div>
            <div className="flex items-center justify-center gap-2 font-display font-bold text-xl">
              <Globe className="w-6 h-6 text-blue-400" /> Jekyll Blogs
            </div>
            <div className="flex items-center justify-center gap-2 font-display font-bold text-xl">
              <Smartphone className="w-6 h-6 text-green-400" /> Android App
            </div>
            <div className="flex items-center justify-center gap-2 font-display font-bold text-xl">
              <Share2 className="w-6 h-6 text-purple-400" /> Multi-Social
            </div>
          </div>
        </div>
      </section>

      {/* Plugin Warning Banner */}
      <section className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="plugin-warning text-sm leading-relaxed">
            {PLUGIN_WARNING}
          </div>
        </div>
      </section>

      {/* Workflow overview */}
      <section id="workflow-overview" className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold mb-3">
              Explore the Jekyll Forge workflow
            </h2>
            <p className="text-muted-foreground">
              Connect a repository, shape a draft, review the change, and
              publish through the tools available to your workspace.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl overflow-hidden aspect-video flex items-center justify-center group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-20" />

            <div
              aria-hidden="true"
              className="relative z-10 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-lg"
            >
              <GitBranch className="w-7 h-7 text-primary" />
            </div>

            <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/50 to-transparent z-5">
              <div className="text-white">
                <h3 className="font-semibold mb-1">Workflow overview</h3>
                <p className="text-sm text-gray-300">
                  Connect → Draft → Review → Publish
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 bg-gradient-to-b from-background to-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 border-primary/30 text-primary bg-primary/10 px-3 py-1 text-xs"
            >
              Powerful Capabilities
            </Badge>
            <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">
              A focused publishing workspace for Jekyll blogs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Visual enough for writers. Powerful enough for developers.
              Mobile-first for creators on-the-go.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-card border border-border/80 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-xl mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
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
                desc: "Use the supported GitHub connection flow, then select a repository for your workspace.",
              },
              {
                n: "02",
                title: "Select your Jekyll site",
                desc: "Auto-detects Jekyll structure, theme, plugins, and build method.",
              },
              {
                n: "03",
                title: "Write visually or in Markdown",
                desc: "Three editor modes with front matter management and autosave in the web workspace.",
              },
              {
                n: "04",
                title: "Repurpose for social media",
                desc: "Adapt content for Twitter, LinkedIn, Facebook, and Instagram using platform-specific formatting.",
              },
              {
                n: "05",
                title: "Schedule & publish",
                desc: "Schedule posts for a chosen time with retry logic, rate-limit handling, and visible recovery details.",
              },
              {
                n: "06",
                title: "Track analytics",
                desc: "Review available performance and engagement data for connected accounts.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
      <section className="px-6 py-16 bg-gradient-to-br from-background to-card/50 border-y border-border relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl opacity-50 animate-pulse-slow delay-500" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">
              Seamlessly integrate with your essential tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Jekyll Forge connects directly to your favorite platforms,
              streamlining your content workflow from creation to distribution
              and analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* GitHub Integration Card */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center shadow-md">
                  <Github className="w-7 h-7 text-white dark:text-black" />
                </div>
                <h3 className="text-2xl font-semibold">GitHub</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Your content lives in your GitHub repository. Jekyll Forge
                provides a powerful visual interface to manage your Jekyll site
                directly, with full control over commits, branches, and pull
                requests.
              </p>
              <div className="text-sm font-mono bg-muted p-4 rounded-lg text-muted-foreground border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Your Jekyll Repo</span>
                </div>
                <div className="text-primary text-center py-1">
                  ↓ Read/Write via API ↓
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Jekyll Forge CMS</span>
                </div>
              </div>
            </motion.div>

            {/* Social Platforms Integration Card */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                  <Share2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold">Social Media</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Amplify your reach by repurposing and scheduling content across
                Twitter, LinkedIn, Facebook, and Instagram. Jekyll Forge adapts
                post formats for each connected platform and keeps the
                publishing workflow visible in one workspace.
              </p>
              <div className="text-sm font-mono bg-muted p-4 rounded-lg text-muted-foreground border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Jekyll Forge Content</span>
                </div>
                <div className="text-primary text-center py-1">
                  ↓ Repurpose & Schedule ↓
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <Instagram className="w-5 h-5 text-pink-500" />
                </div>
              </div>
            </motion.div>

            {/* Analytics Integration Card */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold">Analytics</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Review the impressions, engagement, and click-through data
                available from your connected social platforms in the Jekyll
                Forge dashboard.
              </p>
              <div className="text-sm font-mono bg-muted p-4 rounded-lg text-muted-foreground border border-border">
                <div className="flex flex-wrap justify-center gap-2 mb-1">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <Instagram className="w-5 h-5 text-pink-500" />
                </div>
                <div className="text-primary text-center py-1">
                  ↓ Aggregate Metrics ↓
                </div>
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" />
                  <span>Jekyll Forge Dashboard</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Central Data Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-20 p-10 bg-card border border-border rounded-3xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50 animate-gradient-shift" />
            <h3 className="text-3xl font-display font-bold text-center mb-10 relative z-10">
              Your Content Workflow, Supercharged
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-lg relative z-10">
              <div className="text-center flex-1">
                <div className="w-20 h-20 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Github className="w-10 h-10 text-white dark:text-black" />
                </div>
                <div className="font-semibold">GitHub</div>
                <div className="text-sm text-muted-foreground">
                  Source of Truth
                </div>
              </div>
              <div className="hidden md:block text-primary text-5xl font-bold animate-bounce-horizontal">
                →
              </div>
              <div className="block md:hidden text-primary text-5xl font-bold animate-bounce-vertical">
                ↓
              </div>
              <div className="text-center flex-1">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="font-semibold">Jekyll Forge</div>
                <div className="text-sm text-muted-foreground">
                  Intelligent CMS
                </div>
              </div>
              <div className="hidden md:block text-primary text-5xl font-bold animate-bounce-horizontal">
                →
              </div>
              <div className="block md:hidden text-primary text-5xl font-bold animate-bounce-vertical">
                ↓
              </div>
              <div className="text-center flex-1">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Share2 className="w-10 h-10 text-white" />
                </div>
                <div className="font-semibold">Social Media</div>
                <div className="text-sm text-muted-foreground">
                  Audience Reach
                </div>
              </div>
              <div className="hidden md:block text-primary text-5xl font-bold animate-bounce-horizontal">
                →
              </div>
              <div className="block md:hidden text-primary text-5xl font-bold animate-bounce-vertical">
                ↓
              </div>
              <div className="text-center flex-1">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <div className="font-semibold">Analytics</div>
                <div className="text-sm text-muted-foreground">
                  Performance Insights
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product principles and availability */}
      <section className="px-6 py-16 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">
              Built for an accountable publishing workflow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jekyll Forge keeps the repository, publishing decisions, and
              connected-account permissions visible instead of obscuring them
              behind a proprietary content store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Github,
                title: "Your repository stays central",
                description:
                  "Jekyll source files, history, and deployment configuration remain in the GitHub repository you connect.",
              },
              {
                icon: Shield,
                title: "Connected accounts stay reviewable",
                description:
                  "Social publishing is tied to explicit connected accounts so permissions can be inspected or removed from the workspace.",
              },
              {
                icon: GitBranch,
                title: "Changes are meant to be inspectable",
                description:
                  "Drafts, front matter, publishing decisions, and repository commits are surfaced as part of the authoring workflow.",
              },
            ].map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 text-primary bg-primary/10"
          >
            Current availability
          </Badge>
          <h2 className="text-3xl font-display font-bold mb-3">
            Start with the web workspace
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The web workspace is available for connected GitHub repositories.
            Android distribution and paid packaging are not advertised until
            their release, billing, and support workflows are fully configured.
          </p>
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
                  The Android companion is undergoing release validation. Its
                  current screens support an evolving subset of the web
                  workflow.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Android editor and Markdown workflows under validation
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Content-repurposing screens under validation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Scheduling and publishing flows under validation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Analytics screens under validation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Offline queue and sync recovery pending real-device acceptance
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-16 bg-card/30 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground">
              Review the current product scope and connection requirements
              before starting.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-background border border-border rounded-lg px-6 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-left font-semibold">
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to forge your Jekyll site?
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your GitHub account and manage your Jekyll blog from the web
            workspace while Android release validation continues.
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
