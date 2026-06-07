import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Activity, CheckCircle2, AlertCircle, XCircle, Globe, GitBranch,
  FileText, Image, Zap, RefreshCw, ExternalLink, Clock, Cpu,
  BarChart2, Shield, Search, Accessibility,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function SiteHealth() {
  const { siteId } = useParams<{ siteId: string }>();
  const { data: site } = trpc.sites.get.useQuery({ id: Number(siteId) }, { enabled: !!siteId });
  const { data: posts } = trpc.posts.list.useQuery({ siteId: Number(siteId) }, { enabled: !!siteId });
  const { data: assets } = trpc.assets.list.useQuery({ siteId: Number(siteId) }, { enabled: !!siteId });
  const { data: scheduled } = trpc.scheduler.list.useQuery({ siteId: Number(siteId) }, { enabled: !!siteId });
  const { data: githubStatus } = trpc.github.status.useQuery();
  const { data: pagesStatus } = trpc.github.getPagesStatus.useQuery(
    { owner: site?.owner || "", repo: site?.repo || "" },
    { enabled: !!site }
  );
  const { data: rateLimit } = trpc.github.getRateLimit.useQuery(undefined, { enabled: !!githubStatus?.connected });

  const publishedPosts = posts?.filter(p => p.status === "published") || [];
  const draftPosts = posts?.filter(p => p.status === "draft" || p.status === "new") || [];
  const postsWithoutDesc = posts?.filter(p => !p.frontMatter || !(p.frontMatter as Record<string, unknown>).description) || [];
  const assetsWithoutAlt = assets?.filter(a => !a.alt && a.mimeType?.startsWith("image/")) || [];
  const pendingScheduled = scheduled?.filter(s => s.status === "pending") || [];
  const failedScheduled = scheduled?.filter(s => s.status === "failed") || [];

  const seoScore = Math.round(
    ((publishedPosts.length > 0 ? 1 : 0) +
     (postsWithoutDesc.length === 0 ? 1 : 0.5) +
     (site?.isJekyll ? 1 : 0) +
     (pagesStatus?.status === "built" ? 1 : 0)) / 4 * 100
  );

  const healthChecks = [
    {
      label: "GitHub Connection",
      status: githubStatus?.connected ? "pass" : "fail",
      detail: githubStatus?.connected ? `Connected as ${githubStatus.login}` : "Not connected",
      icon: GitBranch,
    },
    {
      label: "Jekyll Structure",
      status: site?.isJekyll ? "pass" : "warn",
      detail: site?.isJekyll ? "_posts and _config.yml detected" : "Jekyll structure not confirmed",
      icon: FileText,
    },
    {
      label: "GitHub Pages",
      status: pagesStatus?.status === "built" ? "pass" : pagesStatus ? "warn" : "info",
      detail: pagesStatus ? `Status: ${pagesStatus.status}` : "Pages status unknown",
      icon: Globe,
    },
    {
      label: "API Rate Limit",
      status: rateLimit ? (rateLimit.rate?.remaining > 100 ? "pass" : rateLimit.rate?.remaining > 10 ? "warn" : "fail") : "info",
      detail: rateLimit ? `${rateLimit.rate?.remaining}/${rateLimit.rate?.limit} remaining` : "Unknown",
      icon: Cpu,
    },
    {
      label: "SEO Coverage",
      status: postsWithoutDesc.length === 0 ? "pass" : postsWithoutDesc.length < 3 ? "warn" : "fail",
      detail: postsWithoutDesc.length === 0 ? "All posts have descriptions" : `${postsWithoutDesc.length} posts missing description`,
      icon: Search,
    },
    {
      label: "Image Alt Text",
      status: assetsWithoutAlt.length === 0 ? "pass" : assetsWithoutAlt.length < 3 ? "warn" : "fail",
      detail: assetsWithoutAlt.length === 0 ? "All images have alt text" : `${assetsWithoutAlt.length} images missing alt text`,
      icon: Accessibility,
    },
    {
      label: "Scheduled Posts",
      status: failedScheduled.length === 0 ? "pass" : "fail",
      detail: failedScheduled.length === 0 ? `${pendingScheduled.length} pending` : `${failedScheduled.length} failed`,
      icon: Clock,
    },
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-forge-emerald" />;
    if (status === "warn") return <AlertCircle className="w-4 h-4 text-forge-amber" />;
    if (status === "fail") return <XCircle className="w-4 h-4 text-forge-rose" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Site Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{site?.owner}/{site?.repo}</p>
        </div>
        {pagesStatus?.html_url && (
          <a href={pagesStatus.html_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 text-sm">
              <ExternalLink className="w-4 h-4" />
              View Site
            </Button>
          </a>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "SEO Score", value: seoScore, unit: "%", color: seoScore > 80 ? "text-forge-emerald" : seoScore > 50 ? "text-forge-amber" : "text-forge-rose" },
          { label: "Published Posts", value: publishedPosts.length, unit: "", color: "text-foreground" },
          { label: "Drafts", value: draftPosts.length, unit: "", color: "text-forge-amber" },
          { label: "Assets", value: assets?.length || 0, unit: "", color: "text-foreground" },
        ].map(({ label, value, unit, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="pt-5">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={cn("text-3xl font-display font-bold", color)}>{value}{unit}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health Checks */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Health Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {healthChecks.map(({ label, status, detail, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <StatusIcon status={status} />
              <Icon className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{detail}</div>
              </div>
              <Badge variant="outline" className={cn("text-xs",
                status === "pass" ? "text-forge-emerald border-forge-emerald/30" :
                status === "warn" ? "text-forge-amber border-forge-amber/30" :
                status === "fail" ? "text-forge-rose border-forge-rose/30" :
                "text-muted-foreground"
              )}>
                {status === "pass" ? "OK" : status === "warn" ? "Warning" : status === "fail" ? "Error" : "Info"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Content Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Published", value: publishedPosts.length, total: posts?.length || 1, color: "bg-forge-emerald" },
              { label: "Drafts", value: draftPosts.length, total: posts?.length || 1, color: "bg-forge-amber" },
              { label: "Scheduled", value: pendingScheduled.length, total: posts?.length || 1, color: "bg-forge-violet" },
            ].map(({ label, value, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <Progress value={total > 0 ? (value / total) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              SEO Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {postsWithoutDesc.length > 0 && (
              <div className="flex items-start gap-2 text-forge-amber">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Add descriptions to {postsWithoutDesc.length} posts for better SEO</span>
              </div>
            )}
            {assetsWithoutAlt.length > 0 && (
              <div className="flex items-start gap-2 text-forge-amber">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Add alt text to {assetsWithoutAlt.length} images for accessibility</span>
              </div>
            )}
            {failedScheduled.length > 0 && (
              <div className="flex items-start gap-2 text-forge-rose">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-xs">{failedScheduled.length} scheduled posts failed to publish</span>
              </div>
            )}
            {postsWithoutDesc.length === 0 && assetsWithoutAlt.length === 0 && failedScheduled.length === 0 && (
              <div className="flex items-center gap-2 text-forge-emerald">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">No SEO issues found</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
