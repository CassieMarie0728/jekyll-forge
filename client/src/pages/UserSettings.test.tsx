import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserSettings from './UserSettings';

vi.mock('../lib/trpc', () => ({
  trpc: {
    user: {
      getSettings: {
        useQuery: vi.fn(() => ({
          data: {
            theme: 'dark',
            notifications: true,
            emailDigest: 'weekly',
          },
          isLoading: false,
          error: null,
        })),
      },
      updateSettings: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        })),
      },
    },
  },
}));

describe('UserSettings Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders settings form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserSettings />
      </QueryClientProvider>
    );

    expect(screen.getByText(/theme/i)).toBeInTheDocument();
    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
  });

  it('loads user settings on mount', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserSettings />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/dark/i)).toBeInTheDocument();
    });
  });

  it('allows user to toggle notifications', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <UserSettings />
      </QueryClientProvider>
    );

    const notificationToggle = screen.getByRole('checkbox', { name: /notifications/i });
    await user.click(notificationToggle);

    expect(notificationToggle).toBeChecked();
  });

  it('saves settings on form submission', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(require('../lib/trpc').trpc.user.updateSettings.useMutation).mockReturnValueOnce({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserSettings />
      </QueryClientProvider>
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
