import { lazy } from "react";

// Lazy load page components for code splitting
export const DashboardPage = lazy(() => import("../pages/Dashboard"));
export const EditorPage = lazy(() => import("../pages/Editor"));
export const SocialAnalyticsPage = lazy(
  () => import("../pages/SocialAnalytics")
);
export const UserSettingsPage = lazy(() => import("../pages/UserSettings"));
export const NotFoundPage = lazy(() => import("../pages/NotFound"));
export const ScheduledPostsPage = lazy(
  () => import("../pages/ScheduledPostsScreen")
);

// Preload a component before it's needed
export function preloadComponent(componentName: string) {
  const components: Record<string, () => Promise<any>> = {
    Dashboard: () => import("../pages/Dashboard"),
    Editor: () => import("../pages/Editor"),
    SocialAnalytics: () => import("../pages/SocialAnalytics"),
    UserSettings: () => import("../pages/UserSettings"),
    ScheduledPosts: () => import("../pages/ScheduledPostsScreen"),
  };

  if (components[componentName]) {
    components[componentName]();
  }
}

// Bundle analysis configuration
export const bundleAnalysisConfig = {
  lazyLoadCandidates: [
    "Dashboard",
    "Editor",
    "SocialAnalytics",
    "UserSettings",
    "ScheduledPosts",
  ],
  criticalComponents: ["Home", "Navigation", "Layout", "Auth"],
  targets: {
    main: 150,
    vendor: 200,
    page: 50,
  },
};
