import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';

// Mock tRPC
vi.mock('../lib/trpc', () => ({
  trpc: {
    stats: {
      getOverview: {
        useQuery: vi.fn(() => ({
          data: {
            totalPosts: 42,
            totalEngagement: 1250,
            averageEngagementRate: 3.2,
            topPost: { id: '1', title: 'Test Post', engagement: 500 },
          },
          isLoading: false,
          error: null,
        })),
      },
    },
    auth: {
      me: {
        useQuery: vi.fn(() => ({
          data: { id: 'user1', name: 'Test User', email: 'test@example.com' },
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}));

describe('Dashboard Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders dashboard with stats', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Posts/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(require('../lib/trpc').trpc.stats.getOverview.useQuery).mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state gracefully', async () => {
    vi.mocked(require('../lib/trpc').trpc.stats.getOverview.useQuery).mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: new Error('Failed to load stats'),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
