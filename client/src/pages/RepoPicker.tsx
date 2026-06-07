import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Github, Search, Star, Lock, Globe, GitBranch, Zap, CheckCircle2,
  AlertCircle, Plus, RefreshCw, ExternalLink, ChevronRight, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getLoginUrl } from "@/const";

export default function RepoPicker() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { setActiveSite } = useWorkspace();

  const [search, setSearch] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [detectingRepo, setDetectingRepo] = useState<string | null>(null);

  const { data: githubStatus, refetch: refetchStatus } = trpc.github.status.useQuery(undefined, { enabled: isAuthenticated });
  const { data: repos, isLoading: reposLoading, refetch: refetchRepos } = trpc.github.listRepos.useQuery(
    { search: search || undefined },
    { enabled: !!githubStatus?.connected, refetchOnWindowFocus: false }
  );
  const { data: savedSites, refetch: refetchSites } = trpc.sites.list.useQuery(undefined, { enabled: isAuthenticated });

  const connectMutation = trpc.github.connect.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected as @${data.login}`);
      setShowConnect(false);
      setToken("");
      refetchStatus();
      refetchRepos();
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertSite = trpc.sites.upsert.useMutation();
  const utils = trpc.useUtils();

  const handleConnect = async () => {
    if (!token.trim()) return;
    setConnecting(true);
    try {
      await connectMutation.mutateAsync({ token: token.trim() });
    } finally {
      setConnecting(false);
    }
  };

  const handleSelectRepo = async (repo: { name: string; owner: { login: string }; default_branch: string; private: boolean }) => {
    setDetectingRepo(repo.name);
    try {
      // Detect Jekyll via tRPC
      const detection = await utils.github.detectJekyll.fetch({
        owner: repo.owner.login,
        repo: repo.name,
        branch: repo.default_branch,
      });
      const isJekyll = detection?.isJekyll ?? false;

      const siteId = await upsertSite.mutateAsync({
        owner: repo.owner.login,
        repo: repo.name,
        defaultBranch: repo.default_branch,
        selectedBranch: repo.default_branch,
        isJekyll,
      });

      await refetchSites();
      const freshSites = await utils.sites.list.fetch();
      const site = freshSites?.find((s: { owner: string; repo: string }) => s.owner === repo.owner.login && s.repo === repo.name);
      if (site) setActiveSite(site as Parameters<typeof setActiveSite>[0]);

      toast.success(`${isJekyll ? "Jekyll site detected!" : "Repository connected."} Opening workspace...`);
      navigate(`/dashboard/${siteId}`);
    } catch (err) {
      toast.error("Failed to connect repository");
    } finally {
      setDetectingRepo(null);
    }
  };

  const handleSelectSaved = (site: typeof savedSites extends (infer T)[] | undefined ? T : never) => {
    if (!site) return;
    setActiveSite(site as Parameters<typeof setActiveSite>[0]);
    navigate(`/dashboard/${site.id}`);
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Jekyll Forge</h1>
              <p className="text-xs text-muted-foreground">Select a repository to manage</p>
            </div>
          </div>
          {githubStatus?.connected && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Github className="w-4 h-4" />
              <span>@{githubStatus.login}</span>
              <Badge variant="outline" className="text-forge-emerald border-forge-emerald/30 bg-forge-emerald/10 text-xs">Connected</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* GitHub Not Connected */}
        {!githubStatus?.connected && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Github className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl mb-2">Connect your GitHub account</h2>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Jekyll Forge uses a GitHub Personal Access Token to read and write to your repositories.
                    Your token is stored securely and never logged.
                  </p>
                </div>
                <Button onClick={() => setShowConnect(true)} className="gap-2">
                  <Github className="w-4 h-4" />
                  Connect GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sites */}
        {savedSites && savedSites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Sites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedSites.slice(0, 6).map((site) => (
                <button
                  key={site.id}
                  onClick={() => handleSelectSaved(site)}
                  className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-card/80 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{site.owner}/{site.repo}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <GitBranch className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{site.selectedBranch || site.defaultBranch}</span>
                      {site.isJekyll && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-forge-emerald border-forge-emerald/30">Jekyll</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Repository List */}
        {githubStatus?.connected && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">All Repositories</h2>
              <Button variant="ghost" size="sm" onClick={() => refetchRepos()} className="h-7 text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>

            {reposLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {repos?.map((repo: { id: number; name: string; full_name: string; owner: { login: string; avatar_url: string }; private: boolean; default_branch: string; description?: string; updated_at: string }) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo)}
                    disabled={detectingRepo === repo.name}
                    className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-card/80 transition-all text-left group disabled:opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{repo.full_name}</span>
                        {repo.private ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Globe className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GitBranch className="w-3 h-3" />
                          <span>{repo.default_branch}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    {detectingRepo === repo.name ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>
                ))}
                {repos?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No repositories found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* GitHub Connect Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Connect GitHub
            </DialogTitle>
            <DialogDescription>
              Create a Personal Access Token with <code className="bg-muted px-1 rounded text-xs">repo</code> scope and paste it below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How to create a token:</p>
              <p>1. Go to GitHub → Settings → Developer settings</p>
              <p>2. Personal access tokens → Tokens (classic)</p>
              <p>3. Generate new token with <strong>repo</strong> scope</p>
              <p>4. Copy and paste it below</p>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Personal Access Token</Label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConnect(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleConnect} disabled={!token.trim() || connecting} className="flex-1 gap-2">
                {connecting ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <Github className="w-4 h-4" />}
                Connect
              </Button>
            </div>
            <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" />
              Create token on GitHub
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
