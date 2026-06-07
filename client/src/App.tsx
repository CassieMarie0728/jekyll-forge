import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RepoPicker from "./pages/RepoPicker";
import Editor from "./pages/Editor";
import AssetManager from "./pages/AssetManager";
import ThemeManager from "./pages/ThemeManager";
import AISettings from "./pages/AISettings";
import SiteHealth from "./pages/SiteHealth";
import Scheduler from "./pages/Scheduler";
import AppLayout from "./components/AppLayout";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/repos" component={RepoPicker} />
      <Route path="/dashboard/:siteId" component={() => <AppLayout><Dashboard /></AppLayout>} />
      <Route path="/editor/:siteId/:postPath*" component={() => <AppLayout><Editor /></AppLayout>} />
      <Route path="/editor/:siteId" component={() => <AppLayout><Editor /></AppLayout>} />
      <Route path="/assets/:siteId" component={() => <AppLayout><AssetManager /></AppLayout>} />
      <Route path="/scheduler/:siteId" component={() => <AppLayout><Scheduler /></AppLayout>} />
      <Route path="/themes/:siteId" component={() => <AppLayout><ThemeManager /></AppLayout>} />
      <Route path="/health/:siteId" component={() => <AppLayout><SiteHealth /></AppLayout>} />
      <Route path="/ai-settings/:siteId" component={() => <AppLayout><AISettings /></AppLayout>} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
