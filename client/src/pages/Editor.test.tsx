import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  parseMarkdownFrontMatter,
  readingTime,
  serializeToMarkdown,
  wordCount,
} from '@/lib/editorMarkdown';
import Editor from './Editor';

vi.mock('wouter', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useLocation: () => ['/', vi.fn()],
  useParams: () => ({ siteId: '1' }),
}));

vi.mock('@/contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({ activeSite: null, setActiveSite: vi.fn() }),
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sites: { get: { useQuery: vi.fn(() => ({ data: { id: 1, owner: 'owner', repo: 'repo', selectedBranch: 'main' } })) } },
    posts: {
      list: { useQuery: vi.fn(() => ({ data: [], refetch: vi.fn() })) },
      upsert: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })) },
      autosave: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })) },
    },
    snapshots: { create: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })) } },
    github: { getFile: { useQuery: vi.fn(() => ({ data: undefined, refetch: vi.fn() })) } },
  },
}));

vi.mock('@/components/FrontMatterEditor', () => ({ default: () => <div>Front matter</div> }));
vi.mock('@/components/MarkdownPreview', () => ({ default: () => <div>Preview</div> }));
vi.mock('@/components/AIAssistant', () => ({ default: () => null }));
vi.mock('@/components/PublishDialog', () => ({ default: () => null }));
vi.mock('@/components/SnapshotManager', () => ({ default: () => null }));
vi.mock('@/components/FileBrowser', () => ({ default: () => <div>Files</div> }));
vi.mock('@/components/RepurposingModal', () => ({ RepurposingModal: () => null }));

describe('editor markdown utilities', () => {
  it('parses supported front matter values without changing the post body', () => {
    const result = parseMarkdownFrontMatter(
      '---\ntitle: "Test Post"\npublished: true\npriority: 3\ntags: ["jekyll", "cms"]\n---\n\nBody copy'
    );

    expect(result.frontMatter).toEqual({
      title: 'Test Post',
      published: true,
      priority: 3,
      tags: ['jekyll', 'cms'],
    });
    expect(result.markdown).toBe('Body copy');
  });

  it('serializes front matter safely and excludes unset values', () => {
    expect(
      serializeToMarkdown({ title: 'A "quoted" title', draft: false, empty: null }, 'Body')
    ).toBe('---\ntitle: "A \\"quoted\\" title"\ndraft: false\n---\n\nBody');
  });

  it('calculates a non-zero reading time for short content', () => {
    expect(wordCount('one two three')).toBe(3);
    expect(readingTime('one two three')).toBe(1);
  });

  it('renders the real editor shell under the normal Vitest suite', () => {
    render(<Editor />);

    expect(screen.getByPlaceholderText('Start writing your post in Markdown...')).toBeInTheDocument();
    expect(screen.getByText('Front matter')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });
});
