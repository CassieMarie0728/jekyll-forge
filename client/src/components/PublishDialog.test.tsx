import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublishDialog from "./PublishDialog";
const mocks = vi.hoisted(() => ({
  commit: vi.fn(),
  review: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    github: {
      reviewFile: { useQuery: mocks.review },
      commitFile: { useMutation: () => ({ mutateAsync: mocks.commit }) },
      createBranch: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      createPullRequest: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
    scheduler: { schedule: { useMutation: () => ({ mutateAsync: vi.fn() }) } },
    posts: { update: { useMutation: () => ({ mutateAsync: mocks.update }) } },
  },
}));
const props = {
  open: true,
  onOpenChange: vi.fn(),
  site: { id: 2, owner: "owner", repo: "blog", selectedBranch: "writing" },
  markdown: "New content",
  frontMatter: { title: "Changed title", date: "2026-09-20", layout: "post" },
  siteId: 2,
  postId: 3,
  postPath: "_posts/original.md",
  currentSha: "old-editor-sha",
  onPublished: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.review.mockReturnValue({
    isSuccess: true,
    isFetching: false,
    data: { sha: "review-sha", content: "Original text\n" },
    refetch: vi.fn(),
  });
  mocks.commit.mockResolvedValue({ content: { sha: "new-sha" } });
});
it("requires review and commits to the existing path with the reviewed SHA", async () => {
  render(<PublishDialog {...props} />);
  const publish = screen.getByRole("button", { name: "Publish" });
  expect(publish).toBeDisabled();
  expect(screen.getByLabelText("Content diff")).toHaveTextContent(
    "Original text"
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(publish);
  await waitFor(() =>
    expect(mocks.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        branch: "writing",
        path: "_posts/original.md",
        sha: "review-sha",
      })
    )
  );
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({ markdown: "New content", status: "published" })
  );
});
it("blocks publishing when the destination cannot be read", () => {
  mocks.review.mockReturnValue({
    isSuccess: false,
    isError: true,
    refetch: vi.fn(),
  });
  render(<PublishDialog {...props} />);
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Cannot load destination"
  );
});
it("requires a fresh confirmation after content changes", () => {
  const view = render(<PublishDialog {...props} />);
  fireEvent.click(screen.getByRole("checkbox"));
  view.rerender(<PublishDialog {...props} markdown="Different content" />);
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
});

it("waits for an in-flight draft save before publishing", async () => {
  let finish!: () => void;
  const pending = new Promise<void>(resolve => {
    finish = resolve;
  });
  const beforePublish = vi.fn(() => pending);
  render(<PublishDialog {...props} beforePublish={beforePublish} />);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  await waitFor(() => expect(beforePublish).toHaveBeenCalled());
  expect(mocks.commit).not.toHaveBeenCalled();
  finish();
  await waitFor(() => expect(mocks.commit).toHaveBeenCalled());
});
