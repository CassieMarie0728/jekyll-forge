import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
// Local types to avoid importing from drizzle/schema on the client
type Site = {
  owner: string;
  repo: string;
  selectedBranch?: string | null;
  defaultBranch?: string | null;
};
type Post = {
  id: number;
  path: string;
  status: string;
  sha?: string | null;
  title?: string | null;
  updatedAt: Date;
};
import { formatDistanceToNow } from "date-fns";

type Props = {
  siteId: number;
  site: Site | null | undefined;
  onSelectFile: (path: string) => void;
  selectedFile: string | null;
  posts: Post[];
};

const STATUS_COLORS: Record<string, string> = {
  published: "text-forge-emerald",
  draft: "text-forge-amber",
  new: "text-muted-foreground",
  modified: "text-forge-amber",
  scheduled: "text-forge-violet",
  archived: "text-muted-foreground/50",
};

export default function FileBrowser({
  siteId,
  site,
  onSelectFile,
  selectedFile,
  posts,
}: Props) {
  const [search, setSearch] = useState("");
  const [showDrafts, setShowDrafts] = useState(true);
  const [showPosts, setShowPosts] = useState(true);

  // Also fetch from GitHub
  const { data: ghDrafts, isLoading: draftsLoading } =
    trpc.github.listFiles.useQuery(
      {
        owner: site?.owner || "",
        repo: site?.repo || "",
        path: "_drafts",
        branch: site?.selectedBranch || "main",
      },
      { enabled: !!site, retry: false }
    );
  const { data: ghPosts, isLoading: postsLoading } =
    trpc.github.listFiles.useQuery(
      {
        owner: site?.owner || "",
        repo: site?.repo || "",
        path: "_posts",
        branch: site?.selectedBranch || "main",
      },
      { enabled: !!site, retry: false }
    );

  const allFiles = [
    ...(Array.isArray(ghDrafts)
      ? ghDrafts.map((f: { name: string; path: string; sha: string }) => ({
          ...f,
          folder: "_drafts",
        }))
      : []),
    ...(Array.isArray(ghPosts)
      ? ghPosts.map((f: { name: string; path: string; sha: string }) => ({
          ...f,
          folder: "_posts",
        }))
      : []),
  ];

  const filtered = allFiles.filter(
    f => !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  const drafts = filtered.filter(f => f.folder === "_drafts");
  const publishedPosts = filtered.filter(f => f.folder === "_posts");

  const getPostStatus = (path: string) => {
    const post = posts.find(p => p.path === path);
    return post?.status || "new";
  };

  const FileItem = ({
    file,
  }: {
    file: { name: string; path: string; sha: string; folder: string };
  }) => {
    const status = getPostStatus(file.path);
    const isSelected = selectedFile === file.path;
    return (
      <button
        onClick={() => onSelectFile(file.path)}
        className={cn(
          "w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent"
        )}
      >
        <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">
            {file.name.replace(/\.md$/, "")}
          </div>
          <div
            className={cn(
              "text-[10px] mt-0.5",
              STATUS_COLORS[status] || "text-muted-foreground"
            )}
          >
            {status}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="h-6 pl-6 text-xs bg-muted/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Drafts */}
        <div>
          <button
            onClick={() => setShowDrafts(!showDrafts)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {showDrafts ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {showDrafts ? (
              <FolderOpen className="w-3 h-3" />
            ) : (
              <Folder className="w-3 h-3" />
            )}
            Drafts ({drafts.length})
          </button>
          {showDrafts && (
            <div>
              {draftsLoading ? (
                <div className="px-3 space-y-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : drafts.length === 0 ? (
                <div className="px-3 py-2 text-[10px] text-muted-foreground">
                  No drafts
                </div>
              ) : (
                drafts.map(f => <FileItem key={f.path} file={f} />)
              )}
            </div>
          )}
        </div>

        {/* Posts */}
        <div>
          <button
            onClick={() => setShowPosts(!showPosts)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {showPosts ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {showPosts ? (
              <FolderOpen className="w-3 h-3" />
            ) : (
              <Folder className="w-3 h-3" />
            )}
            Posts ({publishedPosts.length})
          </button>
          {showPosts && (
            <div>
              {postsLoading ? (
                <div className="px-3 space-y-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : publishedPosts.length === 0 ? (
                <div className="px-3 py-2 text-[10px] text-muted-foreground">
                  No posts
                </div>
              ) : (
                publishedPosts.map(f => <FileItem key={f.path} file={f} />)
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
