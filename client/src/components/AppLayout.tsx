import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  Image,
  Palette,
  Puzzle,
  Cpu,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Globe,
  LogOut,
  User,
  Command,
  Plus,
  Zap,
  Menu,
  X,
  Moon,
  Sun,
  Calendar,
  Wand2,
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: (id: string) => `/dashboard/${id}`,
  },
  { icon: FileText, label: "Posts", href: (id: string) => `/editor/${id}` },
  { icon: Image, label: "Assets", href: (id: string) => `/assets/${id}` },
  {
    icon: Calendar,
    label: "Scheduler",
    href: (id: string) => `/scheduler/${id}`,
  },
  { icon: Palette, label: "Themes", href: (id: string) => `/themes/${id}` },
  {
    icon: Activity,
    label: "Site Health",
    href: (id: string) => `/health/${id}`,
  },
];

const BOTTOM_NAV = [
  {
    icon: Wand2,
    label: "AI Settings",
    href: (id: string) => `/ai-settings/${id}`,
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { activeSite } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  const { data: githubStatus } = trpc.github.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: sites } = trpc.sites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const siteId =
    activeSite?.id?.toString() || sites?.[0]?.id?.toString() || "0";

  // Cmd+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const Sidebar = () => (
    <aside
      className={cn(
        "flex flex-col h-full forge-sidebar border-r transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-4 border-b border-sidebar-border",
          collapsed && "justify-center"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-base text-sidebar-foreground tracking-tight">
            Jekyll Forge
          </span>
        )}
      </div>

      {/* Site Selector */}
      {!collapsed && activeSite && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <Link href="/repos">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors">
              <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-sidebar-foreground truncate">
                  {activeSite.owner}/{activeSite.repo}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <GitBranch className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {activeSite.selectedBranch || activeSite.defaultBranch}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const path = href(siteId);
          const isActive = location.startsWith(
            path.split("/").slice(0, 3).join("/")
          );
          return (
            <Tooltip key={label} delayDuration={collapsed ? 200 : 9999}>
              <TooltipTrigger asChild>
                <Link href={path}>
                  <div
                    className={cn(
                      "nav-item",
                      isActive && "active",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </div>
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          );
        })}

        <div className="pt-2 mt-2 border-t border-sidebar-border">
          {BOTTOM_NAV.map(({ icon: Icon, label, href }) => {
            const path = href(siteId);
            const isActive = location === path;
            return (
              <Tooltip key={label} delayDuration={collapsed ? 200 : 9999}>
                <TooltipTrigger asChild>
                  <Link href={path}>
                    <div
                      className={cn(
                        "nav-item",
                        isActive && "active",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </div>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div
        className={cn(
          "px-2 py-3 border-t border-sidebar-border",
          collapsed && "flex justify-center"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors w-full",
                collapsed && "justify-center w-auto"
              )}
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={githubStatus?.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-medium text-sidebar-foreground truncate">
                    {user?.name || "User"}
                  </div>
                  {githubStatus?.login && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      @{githubStatus.login}
                    </div>
                  )}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="w-4 h-4 mr-2" />
              ) : (
                <Moon className="w-4 h-4 mr-2" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex relative flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-56 relative">
            <Sidebar />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-12 flex items-center gap-3 px-4 border-b border-border bg-card/50 flex-shrink-0">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex-1" />

          {/* Command Palette Trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Command className="w-3 h-3" />
            <span>Command Palette</span>
            <kbd className="ml-1 text-[10px] bg-background border border-border rounded px-1">
              ⌘K
            </kbd>
          </button>

          {/* New Post Button */}
          {activeSite && (
            <Link href={`/editor/${activeSite.id}`}>
              <Button size="sm" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" />
                New Post
              </Button>
            </Link>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        activeSiteId={activeSite?.id}
      />
    </div>
  );
}
