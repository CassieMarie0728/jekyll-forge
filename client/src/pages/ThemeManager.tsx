import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Palette, ExternalLink, Plus, CheckCircle2, Star, Download,
  RefreshCw, Search, Package, Puzzle, Settings2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const POPULAR_THEMES = [
  { name: "minima", displayName: "Minima", desc: "Jekyll's default theme — clean, minimal, and versatile", stars: "3.2k", url: "https://github.com/jekyll/minima" },
  { name: "minimal-mistakes", displayName: "Minimal Mistakes", desc: "A flexible two-column Jekyll theme", stars: "12.1k", url: "https://github.com/mmistakes/minimal-mistakes" },
  { name: "just-the-docs", displayName: "Just the Docs", desc: "A modern, high customizable, responsive Jekyll theme for documentation", stars: "6.8k", url: "https://github.com/just-the-docs/just-the-docs" },
  { name: "chirpy", displayName: "Chirpy", desc: "A minimal, responsive, and feature-rich Jekyll theme for technical writing", stars: "6.5k", url: "https://github.com/cotes2020/jekyll-theme-chirpy" },
  { name: "beautiful-jekyll", displayName: "Beautiful Jekyll", desc: "A ready-to-use template to help you create a beautiful website quickly", stars: "5.1k", url: "https://github.com/daattali/beautiful-jekyll" },
  { name: "al-folio", displayName: "Al-Folio", desc: "A beautiful, simple, clean, and responsive Jekyll theme for academics", stars: "10.2k", url: "https://github.com/alshedivat/al-folio" },
];

const POPULAR_PLUGINS = [
  { name: "jekyll-seo-tag", desc: "Add metadata tags for search engines and social networks", category: "SEO" },
  { name: "jekyll-sitemap", desc: "Silently generate a sitemaps.org compliant sitemap", category: "SEO" },
  { name: "jekyll-feed", desc: "Generate an Atom feed of your Jekyll posts", category: "Content" },
  { name: "jekyll-paginate", desc: "Pagination generator for Jekyll", category: "Navigation" },
  { name: "jekyll-archives", desc: "Automatically generate post archives by dates, tags, and categories", category: "Navigation" },
  { name: "jekyll-redirect-from", desc: "Seamlessly specify multiple redirections URLs for your pages and posts", category: "Utility" },
  { name: "jekyll-compress-html", desc: "Compresses HTML in pure Liquid", category: "Performance" },
  { name: "jekyll-minifier", desc: "Minifies HTML, CSS, and JavaScript", category: "Performance" },
];

export default function ThemeManager() {
  const { siteId } = useParams<{ siteId: string }>();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"themes" | "plugins">("themes");
  const [showActionsDialog, setShowActionsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ name: string; type: "theme" | "plugin" } | null>(null);

  const { data: site } = trpc.sites.get.useQuery({ id: Number(siteId) }, { enabled: !!siteId });
  const { data: config } = trpc.github.getJekyllConfig.useQuery(
    { owner: site?.owner || "", repo: site?.repo || "" },
    { enabled: !!site }
  );

  const currentTheme = (config as Record<string, unknown>)?.theme as string || "minima";
  const currentPlugins = (config as Record<string, unknown>)?.plugins as string[] || [];

  const generateWorkflow = trpc.github.generateActionsWorkflow.useMutation({
    onSuccess: () => toast.success("GitHub Actions workflow generated!"),
    onError: (err) => toast.error(err.message),
  });

  const filteredThemes = POPULAR_THEMES.filter(t =>
    !search || t.name.includes(search.toLowerCase()) || t.displayName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPlugins = POPULAR_PLUGINS.filter(p =>
    !search || p.name.includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = (name: string, type: "theme" | "plugin") => {
    setSelectedItem({ name, type });
    setShowActionsDialog(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Themes & Plugins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your Jekyll theme and plugins</p>
        </div>
        <Button
          variant="outline" size="sm" className="gap-2"
          onClick={() => generateWorkflow.mutate({ owner: site?.owner || "", repo: site?.repo || "", branch: site?.selectedBranch || "main" })}
          disabled={generateWorkflow.isPending}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Generate CI Workflow
        </Button>
      </div>

      {/* Current Config */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Theme:</span>
            <Badge variant="outline" className="text-xs">{currentTheme}</Badge>
          </div>
          <div className="flex items-start gap-2">
            <Puzzle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">Plugins:</span>
            <div className="flex flex-wrap gap-1">
              {currentPlugins.length > 0 ? currentPlugins.map(p => (
                <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
              )) : <span className="text-xs text-muted-foreground">None configured</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted/50 p-1 rounded-lg w-fit">
        {(["themes", "plugins"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "themes" ? "Themes" : "Plugins"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab}...`}
          className="pl-9 bg-card"
        />
      </div>

      {/* Themes Grid */}
      {tab === "themes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredThemes.map((theme) => (
            <Card key={theme.name} className={cn("bg-card border-border transition-all hover:border-primary/30", currentTheme === theme.name && "border-primary/50 bg-primary/5")}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{theme.displayName}</span>
                      {currentTheme === theme.name && (
                        <Badge className="bg-forge-emerald/15 text-forge-emerald border-forge-emerald/30 text-[10px] px-1.5 py-0 h-4">Active</Badge>
                      )}
                    </div>
                    <code className="text-xs text-muted-foreground">{theme.name}</code>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-forge-amber text-forge-amber" />
                    {theme.stars}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{theme.desc}</p>
                <div className="flex gap-2">
                  <Button
                    variant={currentTheme === theme.name ? "secondary" : "outline"}
                    size="sm" className="h-7 text-xs flex-1 gap-1"
                    onClick={() => handleApply(theme.name, "theme")}
                    disabled={currentTheme === theme.name}
                  >
                    {currentTheme === theme.name ? <><CheckCircle2 className="w-3 h-3" />Active</> : <><Download className="w-3 h-3" />Apply</>}
                  </Button>
                  <a href={theme.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plugins Grid */}
      {tab === "plugins" && (
        <div className="space-y-3">
          {filteredPlugins.map((plugin) => {
            const isInstalled = currentPlugins.includes(plugin.name);
            return (
              <div key={plugin.name} className={cn("flex items-center gap-4 p-4 bg-card border border-border rounded-xl transition-all hover:border-primary/30", isInstalled && "border-forge-emerald/30 bg-forge-emerald/5")}>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Puzzle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <code className="text-sm font-medium">{plugin.name}</code>
                    {isInstalled && <Badge className="bg-forge-emerald/15 text-forge-emerald border-forge-emerald/30 text-[10px] px-1.5 py-0 h-4">Installed</Badge>}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{plugin.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{plugin.desc}</p>
                </div>
                <Button
                  variant={isInstalled ? "secondary" : "outline"}
                  size="sm" className="h-7 text-xs gap-1 flex-shrink-0"
                  onClick={() => handleApply(plugin.name, "plugin")}
                >
                  {isInstalled ? <><CheckCircle2 className="w-3 h-3" />Installed</> : <><Plus className="w-3 h-3" />Add</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions Dialog */}
      <Dialog open={showActionsDialog} onOpenChange={setShowActionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply {selectedItem?.type === "theme" ? "Theme" : "Plugin"}: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              To apply this {selectedItem?.type}, update your <code className="bg-muted px-1 rounded">_config.yml</code> and <code className="bg-muted px-1 rounded">Gemfile</code>:
            </p>
            {selectedItem?.type === "theme" ? (
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`# _config.yml
theme: ${selectedItem.name}

# Gemfile
gem "${selectedItem.name}"`}
              </pre>
            ) : (
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`# _config.yml
plugins:
  - ${selectedItem?.name}

# Gemfile
gem "${selectedItem?.name}"`}
              </pre>
            )}
            <p className="text-xs text-muted-foreground">
              After updating, commit the changes and GitHub Pages will rebuild your site automatically.
              Use the "Generate CI Workflow" button to create a GitHub Actions workflow for automated builds.
            </p>
            <Button onClick={() => setShowActionsDialog(false)} className="w-full">Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
