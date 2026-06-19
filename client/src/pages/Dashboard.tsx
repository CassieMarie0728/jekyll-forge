import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Image,
  GitBranch,
  Globe,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  Cpu,
  Calendar,
  Zap,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { siteId } = useParams<{ siteId: string }>();
  const [, navigate] = useLocation();
  const { activeSite, setActiveSite } = useWorkspace();

  const { data: site, isLoading: siteLoading } = trpc.sites.get.useQuery(
    { id: Number(siteId) },
    { enabled: !!siteId }
  );
  const { data: posts } = trpc.posts.list.useQuery(
    { siteId: Number(siteId) },
    { enabled: !!siteId }
  );
  const { data: assets } = trpc.assets.list.useQuery(
    { siteId: Number(siteId) },
    { enabled: !!siteId }
  );
  const { data: scheduled } = trpc.scheduler.list.useQuery(
    { siteId: Number(siteId) },
    { enabled: !!siteId }
  );
  const { data: githubStatus } = trpc.github.status.useQuery();
  const { data: pagesStatus } = trpc.github.getPagesStatus.useQuery(
    { owner: site?.owner || "", repo: site?.repo || "" },
    { enabled: !!site }
  );
  const { data: rateLimit } = trpc.github.getRateLimit.useQuery(undefined, {
    enabled: !!githubStatus?.connected,
  });

  useEffect(() => {
    if (site && site.id !== activeSite?.id)
      setActiveSite(site as Parameters<typeof setActiveSite>[0]);
  }, [site]);

  if (siteLoading)
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );

  if (!site)
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-semibold text-lg mb-2">Site not found</h2>
        <Button onClick={() => navigate("/repos")}>Back to Repositories</Button>
      </div>
    );

  const publishedPosts = posts?.filter(p => p.status === "published") || [];
  const draftPosts =
    posts?.filter(p => p.status === "draft" || p.status === "new") || [];
  const pendingScheduled = scheduled?.filter(s => s.status === "pending") || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Site Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-bold text-2xl">
              {site.owner}/{site.repo}
            </h1>
            {site.isJekyll && (
              <Badge className="bg-forge-emerald/15 text-forge-emerald border-forge-emerald/30 text-xs">
                Jekyll
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              <span>{site.selectedBranch || site.defaultBranch}</span>
            </div>
            {pagesStatus && (
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <a
                  href={pagesStatus.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-1"
                >
                  GitHub Pages <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>
        <Link href={`/editor/${siteId}`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Published Posts",
            value: publishedPosts.length,
            icon: CheckCircle2,
            color: "text-forge-emerald",
          },
          {
            label: "Drafts",
            value: draftPosts.length,
            icon: FileText,
            color: "text-forge-amber",
          },
          {
            label: "Assets",
            value: assets?.length || 0,
            icon: Image,
            color: "text-primary",
          },
          {
            label: "Scheduled",
            value: pendingScheduled.length,
            icon: Calendar,
            color: "text-forge-violet",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div className="text-3xl font-display font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Recent Posts</h2>
            <Link href={`/editor/${siteId}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {posts?.slice(0, 8).map(post => (
              <Link
                key={post.id}
                href={`/editor/${siteId}/${encodeURIComponent(post.path)}`}
              >
                <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {post.title || post.filename || post.path}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          post.status === "published"
                            ? "text-forge-emerald border-forge-emerald/30"
                            : post.status === "scheduled"
                              ? "text-forge-violet border-forge-violet/30"
                              : "text-muted-foreground"
                        )}
                      >
                        {post.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
            {(!posts || posts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No posts yet</p>
                <Link href={`/editor/${siteId}`}>
                  <Button variant="outline" size="sm" className="mt-3 gap-1">
                    <Plus className="w-3 h-3" />
                    Create first post
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* GitHub Status */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                GitHub Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connection</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      githubStatus?.connected
                        ? "bg-forge-emerald"
                        : "bg-forge-rose"
                    )}
                  />
                  <span className="text-xs">
                    {githubStatus?.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pages</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    pagesStatus?.status === "built"
                      ? "text-forge-emerald border-forge-emerald/30"
                      : "text-muted-foreground"
                  )}
                >
                  {pagesStatus?.status || "Unknown"}
                </Badge>
              </div>
              {rateLimit && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Rate Limit</span>
                  <span className="text-xs font-mono">
                    {rateLimit.rate?.remaining}/{rateLimit.rate?.limit}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Posts */}
          {pendingScheduled.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-forge-violet" />
                  Scheduled Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingScheduled.slice(0, 3).map(s => (
                  <div key={s.id} className="text-xs">
                    <div className="font-medium truncate">
                      {s.draftPath.split("/").pop()}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(s.scheduledAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-forge-amber" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { label: "New Post", href: `/editor/${siteId}`, icon: Plus },
                {
                  label: "Upload Asset",
                  href: `/assets/${siteId}`,
                  icon: Image,
                },
                {
                  label: "Manage Themes",
                  href: `/themes/${siteId}`,
                  icon: Zap,
                },
                {
                  label: "Site Health",
                  href: `/health/${siteId}`,
                  icon: Activity,
                },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href}>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-muted transition-colors text-left">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {label}
                  </button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
