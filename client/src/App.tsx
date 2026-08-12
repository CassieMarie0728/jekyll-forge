import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RepoPicker from "./pages/RepoPicker";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Editor = lazy(() => import("./pages/Editor"));
const AssetManager = lazy(() => import("./pages/AssetManager"));
const ThemeManager = lazy(() => import("./pages/ThemeManager"));
const AISettings = lazy(() => import("./pages/AISettings"));
const SiteHealth = lazy(() => import("./pages/SiteHealth"));
const Scheduler = lazy(() => import("./pages/Scheduler"));
const SocialAnalytics = lazy(() => import("./pages/SocialAnalytics"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
import AppLayout from "./components/AppLayout";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

function RouteFallback() {
  return <div className="min-h-screen bg-background" aria-busy="true" />;
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/repos" component={RepoPicker} />
        <Route
          path="/dashboard/:siteId"
          component={() => (
            <AppLayout>
              <Dashboard />
            </AppLayout>
          )}
        />
        <Route
          path="/editor/:siteId/:postPath*"
          component={() => (
            <AppLayout>
              <Editor />
            </AppLayout>
          )}
        />
        <Route
          path="/editor/:siteId"
          component={() => (
            <AppLayout>
              <Editor />
            </AppLayout>
          )}
        />
        <Route
          path="/assets/:siteId"
          component={() => (
            <AppLayout>
              <AssetManager />
            </AppLayout>
          )}
        />
        <Route
          path="/scheduler/:siteId"
          component={() => (
            <AppLayout>
              <Scheduler />
            </AppLayout>
          )}
        />
        <Route
          path="/themes/:siteId"
          component={() => (
            <AppLayout>
              <ThemeManager />
            </AppLayout>
          )}
        />
        <Route
          path="/health/:siteId"
          component={() => (
            <AppLayout>
              <SiteHealth />
            </AppLayout>
          )}
        />
        <Route
          path="/ai-settings/:siteId"
          component={() => (
            <AppLayout>
              <AISettings />
            </AppLayout>
          )}
        />
        <Route
          path="/social-analytics/:siteId"
          component={() => (
            <AppLayout>
              <SocialAnalytics />
            </AppLayout>
          )}
        />
        <Route
          path="/settings"
          component={() => (
            <AppLayout>
              <UserSettings />
            </AppLayout>
          )}
        />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <WorkspaceProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </WorkspaceProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
