import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./Dashboard";
import { trpc } from "../lib/trpc";

// Mock wouter
vi.mock("wouter", () => ({
  useParams: () => ({ siteId: "1" }),
  useLocation: () => ["/", vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock workspace context
vi.mock("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    activeSite: { id: 1, owner: "testowner", repo: "testrepo", isJekyll: true },
    setActiveSite: vi.fn(),
  }),
}));

// Mock tRPC
vi.mock("../lib/trpc", () => ({
  trpc: {
    sites: {
      get: {
        useQuery: vi.fn(() => ({
          data: {
            id: 1,
            owner: "testowner",
            repo: "testrepo",
            isJekyll: true,
            branch: "main",
            lastSyncAt: new Date().toISOString(),
          },
          isLoading: false,
          error: null,
        })),
      },
    },
    posts: {
      list: {
        useQuery: vi.fn(() => ({
          data: [
            {
              id: 1,
              title: "Test Post 1",
              status: "published",
              path: "_posts/2026-01-01-test.md",
              updatedAt: new Date().toISOString(),
            },
          ],
          isLoading: false,
        })),
      },
    },
    assets: {
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
    scheduler: {
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
    github: {
      status: {
        useQuery: vi.fn(() => ({
          data: { connected: true, username: "testuser" },
          isLoading: false,
        })),
      },
      getPagesStatus: {
        useQuery: vi.fn(() => ({
          data: { status: "built", url: "https://test.github.io" },
          isLoading: false,
        })),
      },
      getRateLimit: {
        useQuery: vi.fn(() => ({
          data: { remaining: 4999, limit: 5000 },
          isLoading: false,
        })),
      },
    },
  },
}));

describe("Dashboard Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("renders dashboard with site repo header", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("testowner/testrepo")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    vi.mocked(trpc.sites.get.useQuery).mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders site not found when site is missing", async () => {
    vi.mocked(trpc.sites.get.useQuery).mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Site not found/i)).toBeInTheDocument();
    });
  });
});
