import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  parseMarkdownFrontMatter,
  readingTime,
  serializeToMarkdown,
  wordCount,
} from "@/lib/editorMarkdown";
import Editor from "./Editor";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";

vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useLocation: () => ["/", vi.fn()],
  useParams: vi.fn(() => ({ siteId: "1" })),
}));

vi.mock("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({ activeSite: null, setActiveSite: vi.fn() }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ client: { github: { getFile: { query: vi.fn() } } } }),
    sites: {
      get: {
        useQuery: vi.fn(() => ({
          data: { id: 1, owner: "owner", repo: "repo", selectedBranch: "main" },
        })),
      },
    },
    posts: {
      list: { useQuery: vi.fn(() => ({ data: [], refetch: vi.fn() })) },
      upsert: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
      autosave: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
    },
    snapshots: {
      create: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
    },
    github: {
      getFile: {
        useQuery: vi.fn(() => ({ data: undefined, refetch: vi.fn() })),
      },
    },
  },
}));

vi.mock("@/components/FrontMatterEditor", () => ({
  default: () => <div>Front matter</div>,
}));
vi.mock("@/components/MarkdownPreview", () => ({
  default: () => <div>Preview</div>,
}));
vi.mock("@/components/AIAssistant", () => ({
  default: () => <div>AI Assistant loaded</div>,
}));
vi.mock("@/components/PublishDialog", () => ({ default: () => null }));
vi.mock("@/components/SnapshotManager", () => ({ default: () => null }));
vi.mock("@/components/FileBrowser", () => ({
  default: () => <div>Files</div>,
}));
vi.mock("@/components/RepurposingModal", () => ({
  RepurposingModal: () => null,
}));

describe("editor markdown utilities", () => {
  it("parses supported front matter values without changing the post body", () => {
    const result = parseMarkdownFrontMatter(
      '---\ntitle: "Test Post"\npublished: true\npriority: 3\ntags: ["jekyll", "cms"]\n---\n\nBody copy'
    );

    expect(result.frontMatter).toEqual({
      title: "Test Post",
      published: true,
      priority: 3,
      tags: ["jekyll", "cms"],
    });
    expect(result.markdown).toBe("Body copy");
  });

  it("serializes front matter safely and excludes unset values", () => {
    expect(
      serializeToMarkdown(
        { title: 'A "quoted" title', draft: false, empty: null },
        "Body"
      )
    ).toBe('---\ntitle: "A \\"quoted\\" title"\ndraft: false\n---\n\nBody');
  });

  it("calculates a non-zero reading time for short content", () => {
    expect(wordCount("one two three")).toBe(3);
    expect(readingTime("one two three")).toBe(1);
  });

  it("renders the real editor shell under the normal Vitest suite", () => {
    render(<Editor />);

    expect(
      screen.getByPlaceholderText("Start writing your post in Markdown...")
    ).toBeInTheDocument();
    expect(screen.getByText("Front matter")).toBeInTheDocument();
    expect(
      screen.getByText("Preview", { selector: "div" })
    ).toBeInTheDocument();
  });

  it("formats the current heading line without inserting descriptions or stacking markers", async () => {
    render(<Editor />);
    const body = screen.getByPlaceholderText(
      "Start writing your post in Markdown..."
    ) as HTMLTextAreaElement;
    fireEvent.change(body, {
      target: { value: "CHAPTER SEVEN\nTERMS OF PROTECTION" },
    });
    body.setSelectionRange(5, 5);
    fireEvent.click(screen.getByTitle("H1"));
    expect(body).toHaveValue("# CHAPTER SEVEN\nTERMS OF PROTECTION");
    await waitFor(() => expect(body.selectionStart).toBe(15));
    body.setSelectionRange(4, 4);
    fireEvent.click(screen.getByTitle("H2"));
    expect(body).toHaveValue("## CHAPTER SEVEN\nTERMS OF PROTECTION");
  });

  it("starts an empty heading without placeholder text", () => {
    render(<Editor />);
    fireEvent.click(screen.getByTitle("H3"));
    expect(
      screen.getByPlaceholderText("Start writing your post in Markdown...")
    ).toHaveValue("### ");
  });

  it("preserves selected list content and places the caret inside empty bold markup", async () => {
    render(<Editor />);
    const body = screen.getByPlaceholderText(
      "Start writing your post in Markdown..."
    ) as HTMLTextAreaElement;
    fireEvent.change(body, { target: { value: "First\nSecond" } });
    body.setSelectionRange(0, body.value.length);
    fireEvent.click(screen.getByTitle("List"));
    expect(body).toHaveValue("- First\n- Second");
    await waitFor(() => expect(body.selectionStart).toBe(body.value.length));
    fireEvent.change(body, { target: { value: "" } });
    body.setSelectionRange(0, 0);
    fireEvent.click(screen.getByTitle("Bold"));
    expect(body).toHaveValue("****");
    await waitFor(() => expect(body.selectionStart).toBe(2));
  });

  it("opens mobile post details without replacing the draft", () => {
    render(<Editor />);
    const body = screen.getByPlaceholderText(
      "Start writing your post in Markdown..."
    );
    fireEvent.change(body, { target: { value: "Keep this draft" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Post details" })
    );
    expect(
      screen.getByRole("dialog", { name: "Post details" })
    ).toBeInTheDocument();
    expect(body).toHaveValue("Keep this draft");
  });

  it("honors cancellation when New Post would replace unsaved work", () => {
    render(<Editor />);
    const body = screen.getByPlaceholderText(
      "Start writing your post in Markdown..."
    );
    fireEvent.change(body, { target: { value: "Do not lose this" } });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent(window, new Event("forge:new-post"));
    expect(confirm).toHaveBeenCalled();
    expect(body).toHaveValue("Do not lose this");
    confirm.mockRestore();
  });

  it("loads the AI assistant only after the editor AI control is opened", async () => {
    render(<Editor />);

    expect(screen.queryByText("AI Assistant loaded")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "AI" })[0]
    );

    await waitFor(() => {
      expect(screen.getByText("AI Assistant loaded")).toBeInTheDocument();
    });
  });
});

describe("saved Forge drafts", () => {
  it("restores a database draft without requesting a nonexistent GitHub file and preserves typing on refetch", async () => {
    vi.mocked(useParams).mockReturnValue({
      siteId: "1",
      postPath: "_drafts/smoke.md",
    });
    const draft = {
      id: 5,
      path: "_drafts/smoke.md",
      markdown: "Saved draft body",
      frontMatter: { title: "Smoke test" },
      sha: null,
    };
    vi.mocked(trpc.posts.list.useQuery).mockReturnValue({
      data: [draft],
      isSuccess: true,
      refetch: vi.fn(),
    } as any);
    const view = render(<Editor />);
    const body = screen.getByPlaceholderText(
      "Start writing your post in Markdown..."
    );
    await waitFor(() => expect(body).toHaveValue("Saved draft body"));
    expect(
      vi.mocked(trpc.github.getFile.useQuery).mock.lastCall?.[1]
    ).toMatchObject({ enabled: false });
    fireEvent.change(body, { target: { value: "Still typing" } });
    vi.mocked(trpc.posts.list.useQuery).mockReturnValue({
      data: [{ ...draft }],
      isSuccess: true,
      refetch: vi.fn(),
    } as any);
    view.rerender(<Editor />);
    expect(body).toHaveValue("Still typing");
  });
});
