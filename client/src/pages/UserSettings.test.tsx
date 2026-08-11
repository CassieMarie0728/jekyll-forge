import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserSettings from './UserSettings';

// Mock useAuth
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
    isAuthenticated: true,
  }),
}));

// Mock tRPC
vi.mock('../lib/trpc', () => ({
  trpc: {
    socialMedia: {
      getAccounts: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
    },
    auth: {
      logout: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
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

  it('renders account settings header and profile info', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserSettings />
      </QueryClientProvider>
    );

    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
