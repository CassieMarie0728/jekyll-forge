import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText,
  Eye,
  Code2,
  Plus,
  Save,
  Send,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  GitBranch,
  Calendar,
  Tag,
  AlignLeft,
  Hash,
  Image,
  Link2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Minus,
  Table,
  Code,
  Heading1,
  Heading2,
  Heading3,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Wand2,
  RefreshCw,
  Layers,
  RotateCcw,
  Download,
  Upload,
  Settings2,
  Globe,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseMarkdownFrontMatter,
  readingTime,
  serializeToMarkdown,
  wordCount,
} from "@/lib/editorMarkdown";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDistanceToNow, format } from "date-fns";
import FrontMatterEditor from "@/components/FrontMatterEditor";
import MarkdownPreview from "@/components/MarkdownPreview";
import PublishDialog from "@/components/PublishDialog";
import SnapshotManager from "@/components/SnapshotManager";
import FileBrowser from "@/components/FileBrowser";
import { RepurposingModal } from "@/components/RepurposingModal";
import { Link } from "wouter";

const AIAssistant = lazy(() => import("@/components/AIAssistant"));

type EditorMode = "visual" | "markdown" | "split";

const TOOLBAR_ACTIONS = [
  {
    icon: Bold,
    label: "Bold",
    action: (sel: string) => `**${sel || "bold text"}**`,
  },
  {
    icon: Italic,
    label: "Italic",
    action: (sel: string) => `*${sel || "italic text"}*`,
  },
  {
    icon: Heading1,
    label: "H1",
    action: (sel: string) => `# ${sel || "Heading 1"}`,
  },
  {
    icon: Heading2,
    label: "H2",
    action: (sel: string) => `## ${sel || "Heading 2"}`,
  },
  {
    icon: Heading3,
    label: "H3",
    action: (sel: string) => `### ${sel || "Heading 3"}`,
  },
  {
    icon: Link2,
    label: "Link",
    action: (sel: string) => `[${sel || "link text"}](url)`,
  },
  {
    icon: Image,
    label: "Image",
    action: (sel: string) => `![${sel || "alt text"}](image-url)`,
  },
  {
    icon: Quote,
    label: "Quote",
    action: (sel: string) => `> ${sel || "blockquote"}`,
  },
  {
    icon: Code,
    label: "Code",
    action: (sel: string) => `\`${sel || "code"}\``,
  },
  { icon: List, label: "List", action: () => "- Item 1\n- Item 2\n- Item 3" },
  {
    icon: ListOrdered,
    label: "Ordered List",
    action: () => "1. Item 1\n2. Item 2\n3. Item 3",
  },
  {
    icon: Table,
    label: "Table",
    action: () =>
      "| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |",
  },
  { icon: Minus, label: "Divider", action: () => "\n---\n" },
];

export default function Editor() {
  const { siteId, postPath } = useParams<{
    siteId: string;
    postPath?: string;
  }>();
  const [, navigate] = useLocation();
  const { activeSite, setActiveSite } = useWorkspace();

  const [mode, setMode] = useState<EditorMode>("split");
  const [markdown, setMarkdown] = useState("");
  const [frontMatter, setFrontMatter] = useState<Record<string, unknown>>({
    layout: "post",
    title: "",
    date: format(new Date(), "yyyy-MM-dd HH:mm:ss +0000"),
    categories: [],
    tags: [],
  });
  const [isDirty, setIsDirty] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [currentSha, setCurrentSha] = useState<string | undefined>();
  const [showAI, setShowAI] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showRepurposing, setShowRepurposing] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(
    postPath || null
  );
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [autosaveTimer, setAutosaveTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [remoteUpdated, setRemoteUpdated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conflictCheckTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const { data: site } = trpc.sites.get.useQuery(
    { id: Number(siteId) },
    { enabled: !!siteId }
  );
  const { data: posts, refetch: refetchPosts } = trpc.posts.list.useQuery(
    { siteId: Number(siteId) },
    { enabled: !!siteId }
  );

  const upsertPost = trpc.posts.upsert.useMutation();
  const autosaveMutation = trpc.posts.autosave.useMutation();
  const createSnapshot = trpc.snapshots.create.useMutation();
  const getFileMutation = trpc.github.getFile.useQuery(
    {
      owner: site?.owner || "",
      repo: site?.repo || "",
      path: selectedFile || "",
      branch: site?.selectedBranch || "main",
    },
    {
      enabled: !!site && !!selectedFile && selectedFile !== "new",
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (site && !activeSite)
      setActiveSite(site as Parameters<typeof setActiveSite>[0]);
  }, [site, activeSite, setActiveSite]);

  // Load file from GitHub
  useEffect(() => {
    if (getFileMutation.data && selectedFile) {
      const raw = getFileMutation.data.decodedContent || "";
      const { frontMatter: fm, markdown: md } = parseMarkdownFrontMatter(raw);
      setFrontMatter(fm);
      setMarkdown(md);
      setCurrentSha(getFileMutation.data.sha);
      setIsDirty(false);
    }
  }, [getFileMutation.data, selectedFile]);

  // Autosave to IndexedDB (simulated via server autosave)
  useEffect(() => {
    if (!isDirty || !currentPostId) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    const timer = setTimeout(async () => {
      try {
        await autosaveMutation.mutateAsync({
          id: currentPostId,
          markdown,
          frontMatter,
        });
      } catch {
        /* silent */
      }
    }, 3000);
    setAutosaveTimer(timer);
    return () => clearTimeout(timer);
  }, [markdown, frontMatter, isDirty, currentPostId]);

  // Poll for remote file changes (conflict detection)
  useEffect(() => {
    if (!site || !selectedFile || selectedFile === "new" || !currentSha) return;
    if (conflictCheckTimer.current) clearInterval(conflictCheckTimer.current);
    const checkConflict = async () => {
      try {
        const result = await fetch(
          `/api/trpc/github.getFile?input=${encodeURIComponent(
            JSON.stringify({
              owner: site.owner,
              repo: site.repo,
              path: selectedFile,
              branch: site.selectedBranch || "main",
            })
          )}`
        )
          .then(r => r.json())
          .then(d => d.result.data);
        if (result.sha !== currentSha) {
          setRemoteUpdated(true);
          if (isDirty) setHasConflict(true);
        } else {
          setRemoteUpdated(false);
          setHasConflict(false);
        }
      } catch {
        /* silent */
      }
    };
    conflictCheckTimer.current = setInterval(checkConflict, 30000);
    return () => {
      if (conflictCheckTimer.current) clearInterval(conflictCheckTimer.current);
    };
  }, [site, selectedFile, currentSha, isDirty]);

  const handleNewPost = () => {
    setSelectedFile("new");
    setMarkdown("");
    setFrontMatter({
      layout: "post",
      title: "",
      date: format(new Date(), "yyyy-MM-dd HH:mm:ss +0000"),
      categories: [],
      tags: [],
    });
    setCurrentSha(undefined);
    setCurrentPostId(null);
    setIsDirty(false);
  };

  const handleReloadFromRemote = async () => {
    if (selectedFile && selectedFile !== "new") {
      await getFileMutation.refetch();
      setHasConflict(false);
      setIsDirty(false);
      toast.success("Reloaded from remote");
    }
  };

  const handleSelectFile = async (path: string) => {
    if (isDirty) {
      const ok = confirm("You have unsaved changes. Load this file anyway?");
      if (!ok) return;
    }
    setSelectedFile(path);
  };

  const handleSaveLocal = async () => {
    const title = String(frontMatter.title || "").trim() || "Untitled Post";
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${format(new Date(), "yyyy-MM-dd")}-${slug}.md`;
    const path =
      selectedFile && selectedFile !== "new"
        ? selectedFile
        : `_drafts/${filename}`;

    try {
      const id = await upsertPost.mutateAsync({
        siteId: Number(siteId),
        path,
        filename,
        slug,
        title,
        status: "draft",
        frontMatter,
        markdown,
        sha: currentSha,
      });
      setCurrentPostId(id);
      setIsDirty(false);
      toast.success("Saved locally");
      refetchPosts();
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const handleMarkdownChange = (val: string) => {
    setMarkdown(val);
    setIsDirty(true);
  };

  const handleFrontMatterChange = (fm: Record<string, unknown>) => {
    setFrontMatter(fm);
    setIsDirty(true);
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setMarkdown(prev => prev + "\n" + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const action = TOOLBAR_ACTIONS.find(a => a.label === text);
    const inserted = action ? action.action(selected) : text;
    const newVal = ta.value.slice(0, start) + inserted + ta.value.slice(end);
    setMarkdown(newVal);
    setIsDirty(true);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 0);
  };

  const handleToolbarAction = (action: (sel: string) => string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const inserted = action(selected);
    const newVal = ta.value.slice(0, start) + inserted + ta.value.slice(end);
    setMarkdown(newVal);
    setIsDirty(true);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 0);
  };

  const handleAIInsert = (
    text: string,
    mode: "insert" | "replace" | "append"
  ) => {
    if (mode === "replace") setMarkdown(text);
    else if (mode === "append") setMarkdown(prev => prev + "\n\n" + text);
    else setMarkdown(prev => prev + "\n\n" + text);
    setIsDirty(true);
    toast.success("AI content inserted");
  };

  const handleCreateSnapshot = async (reason: string) => {
    if (!currentPostId) {
      toast.error("Save the post first before creating a snapshot");
      return;
    }
    await createSnapshot.mutateAsync({
      siteId: Number(siteId),
      postId: currentPostId,
      postPath: selectedFile || "",
      label: `${reason} — ${format(new Date(), "MMM d, HH:mm")}`,
      reason: reason as Parameters<
        typeof createSnapshot.mutateAsync
      >[0]["reason"],
      markdown,
      frontMatter,
    });
    toast.success("Snapshot created");
  };

  const wc = wordCount(markdown);
  const rt = readingTime(markdown);

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">
      {/* File Browser Sidebar - Hidden on mobile */}
      {showFileBrowser && (
        <div className="hidden md:flex w-56 flex-shrink-0 border-r border-border bg-card/30 flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Posts
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNewPost}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <FileBrowser
            siteId={Number(siteId)}
            site={site}
            onSelectFile={handleSelectFile}
            selectedFile={selectedFile}
            posts={(posts || []).map(p => ({
              ...p,
              status: p.status ?? "new",
            }))}
          />
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editor Toolbar - Responsive */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 border-b border-border bg-card/30 flex-shrink-0 overflow-x-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowFileBrowser(!showFileBrowser)}
          >
            <Layers className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5" />

          {/* Mode Switcher - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:block">
            <Tabs value={mode} onValueChange={v => setMode(v as EditorMode)}>
              <TabsList className="h-7 bg-muted/50">
                <TabsTrigger value="visual" className="h-5 text-xs px-2 gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="hidden md:inline">Visual</span>
                </TabsTrigger>
                <TabsTrigger
                  value="markdown"
                  className="h-5 text-xs px-2 gap-1"
                >
                  <Code2 className="w-3 h-3" />
                  <span className="hidden md:inline">Markdown</span>
                </TabsTrigger>
                <TabsTrigger value="split" className="h-5 text-xs px-2 gap-1">
                  <AlignLeft className="w-3 h-3" />
                  <span className="hidden md:inline">Split</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Separator orientation="vertical" className="h-5" />
          </div>

          {/* Markdown Toolbar - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto">
            {TOOLBAR_ACTIONS.map(({ icon: Icon, label, action }) => (
              <Button
                key={label}
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                title={label}
                onClick={() => handleToolbarAction(action)}
              >
                <Icon className="w-3 h-3" />
              </Button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Stats - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
            <span>{wc} words</span>
            <span>{rt} min read</span>
            {isDirty && (
              <Badge
                variant="outline"
                className="text-forge-amber border-forge-amber/30 text-[10px] px-1.5 py-0 h-4"
              >
                Unsaved
              </Badge>
            )}
            {autosaveMutation.isPending && (
              <span className="text-[10px]">Autosaving...</span>
            )}
            {hasConflict && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 h-4 animate-pulse"
              >
                Conflict
              </Badge>
            )}
            {remoteUpdated && !isDirty && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                Updated
              </Badge>
            )}
          </div>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          {/* Action Buttons - Responsive */}
          {hasConflict && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs gap-1 flex-shrink-0"
              onClick={handleReloadFromRemote}
            >
              <AlertCircle className="w-3 h-3" />
              <span className="hidden md:inline">Reload</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 flex-shrink-0 hidden sm:flex"
            onClick={() => setShowSnapshots(true)}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Snapshots</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 flex-shrink-0 hidden sm:flex"
            onClick={() => setShowAI(true)}
          >
            <Wand2 className="w-3 h-3 text-forge-violet" />
            <span className="hidden md:inline">AI</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 flex-shrink-0 hidden sm:flex"
            onClick={() => {
              if (!currentPostId) {
                toast.error("Save the post first");
                return;
              }
              setShowRepurposing(true);
            }}
          >
            <Share2 className="w-3 h-3 text-forge-violet" />
            <span className="hidden md:inline">Repurpose</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 flex-shrink-0"
            onClick={handleSaveLocal}
          >
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1 flex-shrink-0"
            onClick={() => {
              if (!selectedFile && !currentPostId) {
                toast.error("Save the post first");
                return;
              }
              handleCreateSnapshot("before-publish").then(() =>
                setShowPublish(true)
              );
            }}
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
        </div>

        {/* Editor Content - Responsive */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Front Matter Panel - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex md:w-64 flex-shrink-0 border-r border-border bg-card/20 overflow-y-auto">
            <FrontMatterEditor
              frontMatter={frontMatter}
              onChange={handleFrontMatterChange}
              siteId={Number(siteId)}
            />
          </div>

          {/* Editor / Preview - Responsive */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Markdown Editor - Full width on mobile, split on desktop */}
            {(mode === "markdown" || mode === "split") && (
              <div className="flex-1 flex flex-col overflow-hidden md:border-r border-border">
                <div className="flex-1 overflow-hidden">
                  <Textarea
                    ref={textareaRef}
                    value={markdown}
                    onChange={e => handleMarkdownChange(e.target.value)}
                    placeholder="Start writing your post in Markdown..."
                    className="h-full w-full resize-none border-0 rounded-none bg-transparent font-mono text-sm leading-relaxed p-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                    spellCheck
                  />
                </div>
              </div>
            )}

            {/* Preview - Hidden on mobile in markdown mode */}
            {(mode === "visual" || mode === "split") && (
              <div
                className="flex-1 overflow-y-auto bg-background hidden md:block"
                style={{ display: mode === "visual" ? "block" : "" }}
              >
                <div className="max-w-2xl mx-auto px-8 py-6">
                  {frontMatter.title != null && (
                    <h1 className="text-3xl font-display font-bold mb-2">
                      {String(frontMatter.title)}
                    </h1>
                  )}
                  {frontMatter.date != null && (
                    <p className="text-sm text-muted-foreground mb-6">
                      {String(frontMatter.date)}
                    </p>
                  )}
                  <MarkdownPreview markdown={markdown} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Sheet - Responsive width */}
      <Sheet open={showAI} onOpenChange={setShowAI}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>AI writing assistant</SheetTitle>
            <SheetDescription>
              Generate and apply writing assistance for the current post.
            </SheetDescription>
          </SheetHeader>
          {showAI && (
            <Suspense
              fallback={
                <div className="p-6 text-sm text-muted-foreground">
                  Loading AI assistant…
                </div>
              }
            >
              <AIAssistant
                markdown={markdown}
                frontMatter={frontMatter}
                siteId={Number(siteId)}
                onInsert={handleAIInsert}
                onFrontMatterUpdate={handleFrontMatterChange}
                onCreateSnapshot={handleCreateSnapshot}
              />
            </Suspense>
          )}
        </SheetContent>
      </Sheet>

      {/* Repurposing Modal */}
      {currentPostId && (
        <RepurposingModal
          open={showRepurposing}
          onOpenChange={setShowRepurposing}
          postId={currentPostId}
          siteId={Number(siteId)}
          postTitle={String(frontMatter.title || "Untitled")}
        />
      )}

      {/* Publish Dialog - Responsive */}
      <PublishDialog
        open={showPublish}
        onOpenChange={setShowPublish}
        site={site}
        markdown={markdown}
        frontMatter={frontMatter}
        currentSha={currentSha}
        postPath={selectedFile}
        postId={currentPostId}
        siteId={Number(siteId)}
        onPublished={(sha, path) => {
          setCurrentSha(sha);
          setSelectedFile(path);
          setIsDirty(false);
          refetchPosts();
        }}
      />

      {/* Snapshots Dialog */}
      <Dialog open={showSnapshots} onOpenChange={setShowSnapshots}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Revision Snapshots
            </DialogTitle>
          </DialogHeader>
          <SnapshotManager
            siteId={Number(siteId)}
            postPath={selectedFile || ""}
            onRestore={(md, fm) => {
              setMarkdown(md);
              setFrontMatter(fm);
              setIsDirty(true);
              setShowSnapshots(false);
              toast.success("Snapshot restored");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
