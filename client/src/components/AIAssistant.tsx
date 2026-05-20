import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Wand2, Sparkles, FileText, RotateCcw, Zap, Tag, Hash, Globe,
  AlignLeft, MessageSquare, List, Search, Copy, CheckCircle2,
  ChevronDown, ChevronRight, Loader2, X, Plus, Replace, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

type Props = {
  markdown: string;
  frontMatter: Record<string, unknown>;
  siteId: number;
  onInsert: (text: string, mode: "insert" | "replace" | "append") => void;
  onFrontMatterUpdate: (fm: Record<string, unknown>) => void;
  onCreateSnapshot: (reason: string) => Promise<void>;
};

const TASK_GROUPS = [
  {
    label: "Generate",
    tasks: [
      { id: "title", icon: Hash, label: "Generate Titles", desc: "5 compelling title options" },
      { id: "outline", icon: List, label: "Generate Outline", desc: "Structured post outline" },
      { id: "draft", icon: FileText, label: "Write Draft", desc: "Full post from outline/topic" },
      { id: "continue", icon: ArrowDown, label: "Continue Writing", desc: "Continue from where you left off" },
      { id: "faq", icon: MessageSquare, label: "Generate FAQ", desc: "Relevant Q&A section" },
      { id: "toc", icon: List, label: "Table of Contents", desc: "From headings in post" },
    ],
  },
  {
    label: "Improve",
    tasks: [
      { id: "rewrite", icon: RotateCcw, label: "Rewrite", desc: "Improve clarity and flow" },
      { id: "shorter", icon: Zap, label: "Make Shorter", desc: "Concise version" },
      { id: "longer", icon: Plus, label: "Make Longer", desc: "Add more depth" },
      { id: "grammar", icon: CheckCircle2, label: "Fix Grammar", desc: "Spelling & punctuation" },
      { id: "markdown-cleanup", icon: AlignLeft, label: "Clean Markdown", desc: "Fix formatting issues" },
      { id: "convert-html", icon: Globe, label: "HTML to Markdown", desc: "Convert HTML content" },
    ],
  },
  {
    label: "SEO & Meta",
    tasks: [
      { id: "seo", icon: Search, label: "SEO Meta", desc: "Title + meta description" },
      { id: "tags", icon: Tag, label: "Generate Tags", desc: "Relevant post tags" },
      { id: "categories", icon: Hash, label: "Categories", desc: "Suggested categories" },
      { id: "slug", icon: Globe, label: "Generate Slug", desc: "URL-friendly slug" },
      { id: "excerpt", icon: AlignLeft, label: "Write Excerpt", desc: "Compelling 1-2 sentence excerpt" },
    ],
  },
  {
    label: "Content",
    tasks: [
      { id: "summary", icon: AlignLeft, label: "Summarize", desc: "3-5 sentence summary" },
      { id: "social", icon: MessageSquare, label: "Social Posts", desc: "Twitter, LinkedIn, Mastodon" },
      { id: "callout", icon: Sparkles, label: "Add Callout", desc: "Relevant callout box" },
      { id: "internal-links", icon: Globe, label: "Internal Links", desc: "Link opportunity suggestions" },
    ],
  },
];

export default function AIAssistant({ markdown, frontMatter, siteId, onInsert, onFrontMatterUpdate, onCreateSnapshot }: Props) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Generate: true, Improve: false, "SEO & Meta": false, Content: false });

  const generateMutation = trpc.ai.generate.useMutation({
    onSuccess: (data) => {
      const text = typeof data.text === "string" ? data.text : String(data.text ?? "");
      setResult(text);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRun = async () => {
    if (!selectedTask) return;
    await onCreateSnapshot("before-ai");
    generateMutation.mutate({
      task: selectedTask,
      userPrompt: customPrompt || undefined,
      postMarkdown: markdown,
      frontMatter,
      tone,
    });
  };

  const handleInsert = (mode: "insert" | "replace" | "append") => {
    if (!result) return;
    onInsert(result, mode);
    toast.success(`Content ${mode === "replace" ? "replaced" : "inserted"}`);
  };

  const handleApplyFrontMatter = () => {
    if (!result) return;
    try {
      // Try to parse as JSON (for seo task)
      const parsed = JSON.parse(result);
      if (parsed.seoTitle || parsed.metaDescription) {
        onFrontMatterUpdate({
          ...frontMatter,
          ...(parsed.seoTitle && { seo_title: parsed.seoTitle }),
          ...(parsed.metaDescription && { description: parsed.metaDescription }),
        });
        toast.success("SEO fields updated in front matter");
        return;
      }
    } catch { /* not JSON */ }

    // For tags/categories
    if (selectedTask === "tags") {
      const tags = result.split(",").map(t => t.trim()).filter(Boolean);
      onFrontMatterUpdate({ ...frontMatter, tags });
      toast.success("Tags updated");
    } else if (selectedTask === "categories") {
      const cats = result.split(",").map(t => t.trim()).filter(Boolean);
      onFrontMatterUpdate({ ...frontMatter, categories: cats });
      toast.success("Categories updated");
    } else if (selectedTask === "slug") {
      onFrontMatterUpdate({ ...frontMatter, slug: result.trim() });
      toast.success("Slug updated");
    } else if (selectedTask === "excerpt") {
      onFrontMatterUpdate({ ...frontMatter, excerpt: result.trim() });
      toast.success("Excerpt updated");
    }
  };

  const canApplyToFrontMatter = ["seo", "tags", "categories", "slug", "excerpt"].includes(selectedTask || "");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Wand2 className="w-4 h-4 text-forge-violet" />
        <span className="font-semibold text-sm">AI Writing Assistant</span>
        <Badge variant="outline" className="ml-auto text-[10px] text-forge-violet border-forge-violet/30">Server-side</Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Task Selection */}
          {TASK_GROUPS.map(({ label, tasks }) => (
            <div key={label}>
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))}
                className="flex items-center gap-1.5 w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
              >
                {expandedGroups[label] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {label}
              </button>
              {expandedGroups[label] && (
                <div className="grid grid-cols-2 gap-1.5">
                  {tasks.map(({ id, icon: Icon, label: taskLabel, desc }) => (
                    <button
                      key={id}
                      onClick={() => { setSelectedTask(id); setResult(null); }}
                      className={cn(
                        "flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-left transition-all",
                        selectedTask === id
                          ? "border-forge-violet/50 bg-forge-violet/10 text-foreground"
                          : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs font-medium">{taskLabel}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Separator />

          {/* Options */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["professional", "casual", "technical", "friendly", "formal", "conversational", "humorous"].map(t => (
                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Additional Instructions (optional)</label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Any specific requirements or context..."
                className="text-xs min-h-[60px] resize-none"
                rows={3}
              />
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!selectedTask || generateMutation.isPending}
            className="w-full gap-2"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Generate</>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Result</div>
              <div className="bg-muted/30 rounded-lg p-3 text-sm max-h-64 overflow-y-auto">
                <Streamdown>{result}</Streamdown>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleInsert("append")}>
                  <Plus className="w-3 h-3" />Append
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleInsert("replace")}>
                  <Replace className="w-3 h-3" />Replace
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                  navigator.clipboard.writeText(result);
                  toast.success("Copied to clipboard");
                }}>
                  <Copy className="w-3 h-3" />Copy
                </Button>
                {canApplyToFrontMatter && (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleApplyFrontMatter}>
                    <CheckCircle2 className="w-3 h-3" />Apply to Front Matter
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setResult(null)}>
                  <X className="w-3 h-3" />Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
