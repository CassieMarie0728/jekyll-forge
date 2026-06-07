import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Send, GitBranch, Calendar, CheckCircle2, AlertCircle, XCircle,
  GitPullRequest, Diff, Clock, Save, FileText, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
// Local type to avoid importing from drizzle/schema on the client
type Site = { id: number; owner: string; repo: string; selectedBranch?: string | null; defaultBranch?: string | null; timezone?: string | null; };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  site: Site | null | undefined;
  markdown: string;
  frontMatter: Record<string, unknown>;
  currentSha?: string;
  postPath?: string | null;
  postId?: number | null;
  siteId: number;
  onPublished: (sha: string, path: string) => void;
};

function validatePost(frontMatter: Record<string, unknown>, markdown: string) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!frontMatter.title) errors.push("Missing title in front matter");
  if (!frontMatter.layout) warnings.push("No layout specified — Jekyll will use default");
  if (!frontMatter.date) warnings.push("No date specified");
  if (!markdown.trim()) errors.push("Post content is empty");
  if (markdown.length < 100) warnings.push("Post is very short (< 100 characters)");
  if (!frontMatter.description && !frontMatter.excerpt) warnings.push("No description or excerpt for SEO");
  if (!frontMatter.tags && !frontMatter.categories) warnings.push("No tags or categories");

  const wordCount = markdown.trim().split(/\s+/).length;
  if (wordCount < 50) warnings.push(`Only ${wordCount} words — consider adding more content`);

  return { valid: errors.length === 0, errors, warnings };
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateFilename(frontMatter: Record<string, unknown>): string {
  const date = frontMatter.date ? String(frontMatter.date).slice(0, 10) : format(new Date(), "yyyy-MM-dd");
  const title = String(frontMatter.title || "untitled");
  const slug = generateSlug(title);
  return `${date}-${slug}.md`;
}

function serializePost(frontMatter: Record<string, unknown>, markdown: string): string {
  const lines = ["---"];
  for (const [k, v] of Object.entries(frontMatter)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(i => `"${i}"`).join(", ")}]`);
    else if (typeof v === "boolean") lines.push(`${k}: ${v}`);
    else if (typeof v === "number") lines.push(`${k}: ${v}`);
    else lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`);
  }
  lines.push("---", "", markdown);
  return lines.join("\n");
}

export default function PublishDialog({ open, onOpenChange, site, markdown, frontMatter, currentSha, postPath, postId, siteId, onPublished }: Props) {
  const [tab, setTab] = useState("publish");
  const [action, setAction] = useState<"drafts" | "posts" | "branch" | "pr" | "schedule">("posts");
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState(format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"));
  const [timezone, setTimezone] = useState(site?.timezone || "UTC");
  const [publishing, setPublishing] = useState(false);

  const validation = useMemo(() => validatePost(frontMatter, markdown), [frontMatter, markdown]);
  const filename = useMemo(() => generateFilename(frontMatter), [frontMatter]);
  const targetPath = action === "drafts" ? `_drafts/${filename}` : `_posts/${filename}`;
  const content = useMemo(() => serializePost(frontMatter, markdown), [frontMatter, markdown]);

  const commitMutation = trpc.github.commitFile.useMutation();
  const createBranchMutation = trpc.github.createBranch.useMutation();
  const createPRMutation = trpc.github.createPullRequest.useMutation();
  const scheduleMutation = trpc.scheduler.schedule.useMutation();
  const updatePostMutation = trpc.posts.update.useMutation();

  const handlePublish = async () => {
    if (!site) return;
    if (!validation.valid) {
      toast.error("Fix validation errors before publishing");
      return;
    }

    setPublishing(true);
    try {
      const msg = commitMessage || `${action === "drafts" ? "Save draft" : "Publish post"}: ${frontMatter.title || filename}`;

      if (action === "branch" || action === "pr") {
        const branchName = newBranch || `post/${generateSlug(String(frontMatter.title || "new-post"))}`;
        await createBranchMutation.mutateAsync({
          owner: site.owner, repo: site.repo,
          branchName, fromBranch: site.selectedBranch || site.defaultBranch || "main",
        });
        const result = await commitMutation.mutateAsync({
          owner: site.owner, repo: site.repo,
          path: `_posts/${filename}`, branch: branchName,
          content, message: msg,
        });
        if (action === "pr") {
          const pr = await createPRMutation.mutateAsync({
            owner: site.owner, repo: site.repo,
            title: prTitle || String(frontMatter.title || "New Post"),
            head: branchName, base: site.selectedBranch || site.defaultBranch || "main",
            body: `Published via Jekyll Forge\n\n${String(frontMatter.excerpt || frontMatter.description || "")}`,
          });
          toast.success(`PR #${pr.number} created!`);
        } else {
          toast.success(`Committed to branch: ${branchName}`);
        }
        onPublished(result.content?.sha || "", `_posts/${filename}`);
      } else if (action === "schedule") {
        const draftPath = postPath && postPath.startsWith("_drafts/") ? postPath : `_drafts/${filename}`;
        // Save to drafts first
        await commitMutation.mutateAsync({
          owner: site.owner, repo: site.repo,
          path: draftPath, branch: site.selectedBranch || site.defaultBranch || "main",
          content, message: `Save draft for scheduling: ${frontMatter.title || filename}`,
          sha: currentSha,
        });
        await scheduleMutation.mutateAsync({
          siteId, postId: postId || undefined,
          draftPath, targetPath: `_posts/${filename}`,
          scheduledAt: new Date(scheduleDate),
          timezone, commitMessage: msg,
        });
        toast.success(`Scheduled for ${format(new Date(scheduleDate), "MMM d, yyyy HH:mm")}`);
        onPublished("", draftPath);
      } else {
        const result = await commitMutation.mutateAsync({
          owner: site.owner, repo: site.repo,
          path: targetPath, branch: site.selectedBranch || site.defaultBranch || "main",
          content, message: msg, sha: currentSha,
        });
        if (postId) {
          await updatePostMutation.mutateAsync({
            id: postId,
            status: action === "posts" ? "published" : "draft",
            sha: result.content?.sha,
            path: targetPath,
          } as Parameters<typeof updatePostMutation.mutateAsync>[0]);
        }
        toast.success(action === "posts" ? "Post published!" : "Draft saved to GitHub!");
        onPublished(result.content?.sha || "", targetPath);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Publish Post
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="publish" className="flex-1 text-xs">Publish</TabsTrigger>
            <TabsTrigger value="validate" className="flex-1 text-xs">
              Validation
              {validation.errors.length > 0 && <Badge className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1 h-4">{validation.errors.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 text-xs">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="publish" className="space-y-4 mt-4">
            {/* Action Selector */}
            <div>
              <Label className="text-xs mb-2 block">Publish Action</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: "posts", icon: Send, label: "Publish to _posts", desc: "Live post" },
                  { id: "drafts", icon: Save, label: "Save to _drafts", desc: "Keep as draft" },
                  { id: "branch", icon: GitBranch, label: "Commit to Branch", desc: "New branch" },
                  { id: "pr", icon: GitPullRequest, label: "Create PR", desc: "Pull request" },
                  { id: "schedule", icon: Calendar, label: "Schedule", desc: "Publish later" },
                ].map(({ id, icon: Icon, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setAction(id as typeof action)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-left transition-all",
                      action === id ? "border-primary/50 bg-primary/10" : "border-border hover:border-border/80 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Target Path */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                <span>Target: <code className="bg-muted px-1 rounded">{action === "schedule" ? `_drafts/${filename}` : targetPath}</code></span>
              </div>
            </div>

            {/* Branch options */}
            {(action === "branch" || action === "pr") && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs mb-1 block">New Branch Name</Label>
                  <Input
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    placeholder={`post/${generateSlug(String(frontMatter.title || "new-post"))}`}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                {action === "pr" && (
                  <div>
                    <Label className="text-xs mb-1 block">PR Title</Label>
                    <Input
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                      placeholder={String(frontMatter.title || "New Post")}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Schedule options */}
            {action === "schedule" && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs mb-1 block">Publish Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"].map(tz => (
                        <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Commit Message */}
            <div>
              <Label className="text-xs mb-1 block">Commit Message</Label>
              <Input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={`${action === "drafts" ? "Save draft" : "Publish post"}: ${frontMatter.title || filename}`}
                className="h-7 text-xs"
              />
            </div>

            {/* Publish Button */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handlePublish}
                disabled={publishing || !validation.valid}
                className="flex-1 gap-2"
              >
                {publishing ? (
                  <><div className="animate-spin w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full" />Publishing...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" />{action === "schedule" ? "Schedule" : action === "pr" ? "Create PR" : "Publish"}</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="validate" className="mt-4 space-y-3">
            {validation.errors.length === 0 && validation.warnings.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-forge-emerald/10 rounded-lg text-forge-emerald">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">All checks passed! Ready to publish.</span>
              </div>
            ) : (
              <>
                {validation.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {e}
                  </div>
                ))}
                {validation.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-forge-amber/10 rounded-lg text-forge-amber text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
              {content.slice(0, 2000)}{content.length > 2000 ? "\n...(truncated)" : ""}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
