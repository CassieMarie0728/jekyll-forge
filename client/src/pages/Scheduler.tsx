import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Trash2,
  RefreshCw, Play, FileText, GitBranch, Zap, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending: { color: "text-forge-amber border-forge-amber/30 bg-forge-amber/10", icon: Clock, label: "Pending" },
  published: { color: "text-forge-emerald border-forge-emerald/30 bg-forge-emerald/10", icon: CheckCircle2, label: "Published" },
  failed: { color: "text-forge-rose border-forge-rose/30 bg-forge-rose/10", icon: XCircle, label: "Failed" },
  cancelled: { color: "text-muted-foreground border-border", icon: XCircle, label: "Cancelled" },
};

export default function Scheduler() {
  const { siteId } = useParams<{ siteId: string }>();
  const { data: site } = trpc.sites.get.useQuery({ id: Number(siteId) }, { enabled: !!siteId });
  const { data: scheduled, isLoading, refetch } = trpc.scheduler.list.useQuery({ siteId: Number(siteId) }, { enabled: !!siteId });
  const { data: heartbeatJobs } = trpc.scheduler.listHeartbeatJobs.useQuery({ page: 1, pageSize: 50 });
  const cancelMutation = trpc.scheduler.cancel.useMutation({
    onSuccess: () => { refetch(); toast.success("Schedule cancelled"); },
    onError: (err) => toast.error(err.message),
  });

  const pending = scheduled?.filter(s => s.status === "pending") || [];
  const history = scheduled?.filter(s => s.status !== "pending") || [];
  // Check if any pending posts have no heartbeat job (site not deployed)
  const pendingWithoutCron = pending.filter(s => !s.scheduleCronTaskUid);
  const hasDeployWarning = pendingWithoutCron.length > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Automated post publishing for {site?.owner}/{site?.repo}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", value: pending.length, color: "text-forge-amber" },
          { label: "Published", value: scheduled?.filter(s => s.status === "published").length || 0, color: "text-forge-emerald" },
          { label: "Failed", value: scheduled?.filter(s => s.status === "failed").length || 0, color: "text-forge-rose" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={cn("text-2xl font-display font-bold", color)}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deploy warning */}
      {hasDeployWarning && (
        <Alert className="mb-4 border-forge-amber/40 bg-forge-amber/10">
          <AlertCircle className="h-4 w-4 text-forge-amber" />
          <AlertDescription className="text-sm">
            <strong className="text-forge-amber">{pendingWithoutCron.length} scheduled post{pendingWithoutCron.length > 1 ? 's' : ''} need deployment to activate.</strong>{' '}
            Heartbeat cron jobs require the site to be deployed (published) before they can fire.
            Click <strong>Publish</strong> in the top-right to deploy, then re-schedule these posts.
          </AlertDescription>
        </Alert>
      )}

      {/* Heartbeat jobs summary */}
      {heartbeatJobs && heartbeatJobs.total > 0 && (
        <Card className="bg-card border-border mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium">Active Heartbeat Jobs</span>
              <Badge variant="outline" className="text-xs ml-auto">{heartbeatJobs.total}</Badge>
            </div>
            <div className="mt-2 space-y-1">
              {heartbeatJobs.jobs.slice(0, 5).map(job => (
                <div key={job.taskUid} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{job.name}</span>
                  <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full", job.isEnable ? "bg-forge-emerald" : "bg-muted-foreground")} />
                    {job.isEnable ? 'Active' : 'Paused'}
                    {job.nextExecutionAt && ` · next: ${format(new Date(job.nextExecutionAt), 'MMM d HH:mm')}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 text-sm">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">How Scheduling Works</p>
              <p className="text-muted-foreground text-xs">
                When you schedule a post, it is saved to <code className="bg-muted px-1 rounded">_drafts/</code> on GitHub.
                At the scheduled time, the server automatically moves it to <code className="bg-muted px-1 rounded">_posts/</code>
                and commits it, triggering a GitHub Pages rebuild. Timezone-aware scheduling ensures posts go live at the right local time.
                You will receive a notification if publishing fails. <strong>Note:</strong> The site must be deployed (published) for cron jobs to activate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-forge-amber" />
                Upcoming ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((s) => (
                  <div key={s.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-forge-amber/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-forge-amber/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-forge-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{s.draftPath.split("/").pop()}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(s.scheduledAt), "MMM d, yyyy 'at' HH:mm")}
                        </span>
                        <span>({formatDistanceToNow(new Date(s.scheduledAt), { addSuffix: true })})</span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {s.timezone}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        → <code className="bg-muted px-1 rounded">{s.targetPath}</code>
                      </div>
                      {!s.scheduleCronTaskUid && (
                        <div className="flex items-center gap-1 text-xs text-forge-amber mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Cron not active — deploy site to enable
                        </div>
                      )}
                      {s.scheduleCronTaskUid && (
                        <div className="flex items-center gap-1 text-xs text-forge-emerald mt-1">
                          <Zap className="w-3 h-3" />
                          Cron active
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() => cancelMutation.mutate({ id: s.id })}
                    >
                      <Trash2 className="w-3 h-3" />
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3">History ({history.length})</h2>
              <div className="space-y-2">
                {history.map((s) => {
                  const cfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.cancelled;
                  const Icon = cfg.icon;
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                      <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color.split(" ")[0])} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{s.draftPath.split("/").pop()}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(s.scheduledAt), "MMM d, yyyy HH:mm")}
                          {s.publishedAt && ` · Published ${formatDistanceToNow(new Date(s.publishedAt), { addSuffix: true })}`}
                          {s.errorMessage && ` · Error: ${s.errorMessage}`}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!scheduled || scheduled.length === 0) && (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No scheduled posts</p>
              <p className="text-xs mt-1">Use the editor to schedule a post for future publishing</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
