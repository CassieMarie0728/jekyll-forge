import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, Clock, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  siteId: number;
  postPath: string;
  onRestore: (markdown: string, frontMatter: Record<string, unknown>) => void;
};

const REASON_COLORS: Record<string, string> = {
  manual: "text-primary border-primary/30 bg-primary/10",
  autosave: "text-muted-foreground border-border",
  "before-ai": "text-forge-violet border-forge-violet/30 bg-forge-violet/10",
  "before-publish":
    "text-forge-emerald border-forge-emerald/30 bg-forge-emerald/10",
  "before-theme": "text-forge-amber border-forge-amber/30 bg-forge-amber/10",
  "before-plugin": "text-forge-amber border-forge-amber/30 bg-forge-amber/10",
};

export default function SnapshotManager({
  siteId,
  postPath,
  onRestore,
}: Props) {
  const { data: snapshots, isLoading } = trpc.snapshots.listByPost.useQuery(
    { postPath, siteId },
    { enabled: !!postPath }
  );

  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );

  if (!snapshots || snapshots.length === 0)
    return (
      <div className="text-center py-8 text-muted-foreground">
        <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No snapshots yet</p>
        <p className="text-xs mt-1">
          Snapshots are created automatically before AI operations and
          publishing
        </p>
      </div>
    );

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {snapshots.map(snap => (
        <div
          key={snap.id}
          className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium truncate">{snap.label}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 flex-shrink-0",
                  REASON_COLORS[snap.reason || "manual"]
                )}
              >
                {snap.reason}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(snap.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {snap.markdown && (
                <span className="ml-2">
                  {snap.markdown.trim().split(/\s+/).length} words
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 flex-shrink-0"
            onClick={() =>
              onRestore(
                snap.markdown || "",
                (snap.frontMatter as Record<string, unknown>) || {}
              )
            }
          >
            <RotateCcw className="w-3 h-3" />
            Restore
          </Button>
        </div>
      ))}
    </div>
  );
}
