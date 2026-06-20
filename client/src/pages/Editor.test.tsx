import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Editor from './Editor';

vi.mock('../lib/trpc', () => ({
  trpc: {
    posts: {
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        })),
      },
      getById: {
        useQuery: vi.fn(() => ({
          data: { id: '1', title: 'Test Post', content: 'Test content' },
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}));

describe('Editor Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders editor form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Editor />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText(/title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/content/i)).toBeInTheDocument();
  });

  it('allows user to type in title field', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <Editor />
      </QueryClientProvider>
    );

    const titleInput = screen.getByPlaceholderText(/title/i);
    await user.type(titleInput, 'New Blog Post');

    expect(titleInput).toHaveValue('New Blog Post');
  });

  it('allows user to type in content field', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <Editor />
      </QueryClientProvider>
    );

    const contentInput = screen.getByPlaceholderText(/content/i);
    await user.type(contentInput, 'This is the post content');

    expect(contentInput).toHaveValue('This is the post content');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(require('../lib/trpc').trpc.posts.create.useMutation).mockReturnValueOnce({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Editor />
      </QueryClientProvider>
    );

    const titleInput = screen.getByPlaceholderText(/title/i);
    const contentInput = screen.getByPlaceholderText(/content/i);
    const submitButton = screen.getByRole('button', { name: /publish|submit/i });

    await user.type(titleInput, 'Test Post');
    await user.type(contentInput, 'Test content');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
