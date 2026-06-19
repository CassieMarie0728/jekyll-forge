import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  FileText,
  Image,
  Calendar,
  Activity,
  Palette,
  Wand2,
  Plus,
  GitBranch,
  Globe,
  Settings2,
  Home,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  category: string;
  action: () => void;
  badge?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeSiteId?: number;
};

export default function CommandPalette({
  open,
  onOpenChange,
  activeSiteId,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [, navigate] = useLocation();

  const { data: sites } = trpc.sites.list.useQuery();

  const go = useCallback(
    (path: string) => {
      navigate(path);
      onOpenChange(false);
      setQuery("");
    },
    [navigate, onOpenChange]
  );

  const allCommands: CommandItem[] = [
    // Navigation
    {
      id: "home",
      label: "Go to Home",
      icon: Home,
      category: "Navigation",
      action: () => go("/"),
    },
    {
      id: "repos",
      label: "Repository Picker",
      icon: GitBranch,
      category: "Navigation",
      action: () => go("/repos"),
    },
    ...(activeSiteId
      ? [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: Activity,
            category: "Navigation",
            action: () => go(`/dashboard/${activeSiteId}`),
          },
          {
            id: "editor-new",
            label: "New Post",
            icon: Plus,
            category: "Editor",
            action: () => go(`/editor/${activeSiteId}`),
            badge: "New",
          },
          {
            id: "editor",
            label: "Open Editor",
            icon: FileText,
            category: "Editor",
            action: () => go(`/editor/${activeSiteId}`),
          },
          {
            id: "assets",
            label: "Asset Manager",
            icon: Image,
            category: "Navigation",
            action: () => go(`/assets/${activeSiteId}`),
          },
          {
            id: "scheduler",
            label: "Scheduler",
            icon: Calendar,
            category: "Navigation",
            action: () => go(`/scheduler/${activeSiteId}`),
          },
          {
            id: "health",
            label: "Site Health",
            icon: Activity,
            category: "Navigation",
            action: () => go(`/health/${activeSiteId}`),
          },
          {
            id: "themes",
            label: "Themes & Plugins",
            icon: Palette,
            category: "Navigation",
            action: () => go(`/themes/${activeSiteId}`),
          },
          {
            id: "ai-settings",
            label: "AI Settings",
            icon: Wand2,
            category: "Settings",
            action: () => go(`/ai-settings/${activeSiteId}`),
          },
        ]
      : []),
    // Sites
    ...(sites?.map(s => ({
      id: `site-${s.id}`,
      label: `${s.owner}/${s.repo}`,
      description: `Switch to this site`,
      icon: Globe,
      category: "Sites",
      action: () => go(`/dashboard/${s.id}`),
      badge: s.isJekyll ? "Jekyll" : undefined,
    })) || []),
  ];

  const filtered = query.trim()
    ? allCommands.filter(
        c =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatFiltered[selectedIdx]?.action();
    }
  };

  // Global Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  let flatIdx = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-auto p-0"
            autoFocus
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96">
          {flatFiltered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No commands found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  {cmds.map(cmd => {
                    const idx = flatIdx++;
                    const isSelected = idx === selectedIdx;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.badge && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {cmd.badge}
                          </Badge>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1 rounded border border-border">↑↓</kbd>{" "}
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1 rounded border border-border">↵</kbd>{" "}
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1 rounded border border-border">⌘K</kbd>{" "}
            open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
