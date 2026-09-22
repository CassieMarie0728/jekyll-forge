import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DraftRecovery from "./DraftRecovery";
vi.mock("@/lib/trpc", () => ({
  trpc: { auth: { me: { useQuery: () => ({ data: { id: 7 } }) } } },
}));
beforeEach(() => localStorage.clear());
const props = {
  siteId: 2,
  path: "new",
  postId: null,
  markdown: "Recover this",
  frontMatter: { title: "My draft" },
  dirty: true,
  onRestore: vi.fn(),
};
it("recovers a never-saved draft after remount", () => {
  const view = render(<DraftRecovery {...props} />);
  view.unmount();
  render(<DraftRecovery {...props} dirty={false} markdown="" />);
  fireEvent.click(screen.getByRole("button", { name: /Recovery drafts/ }));
  fireEvent.click(screen.getByRole("button", { name: "Restore" }));
  expect(props.onRestore).toHaveBeenCalledWith(
    expect.objectContaining({ markdown: "Recover this", postId: null })
  );
});
it("isolates recovery copies by workspace", () => {
  const view = render(<DraftRecovery {...props} />);
  view.unmount();
  render(<DraftRecovery {...props} siteId={3} dirty={false} />);
  expect(
    screen.getByRole("button", { name: "Recovery drafts (0)" })
  ).toBeInTheDocument();
});
it("keeps separate new drafts instead of overwriting the previous copy", () => {
  const view = render(<DraftRecovery {...props} />);
  view.rerender(<DraftRecovery {...props} dirty={false} markdown="" />);
  view.rerender(<DraftRecovery {...props} markdown="Second draft" />);
  expect(
    screen.getByRole("button", { name: "Recovery drafts (2)" })
  ).toBeInTheDocument();
});
it("reports browser storage failure", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
    throw new Error("full");
  });
  render(<DraftRecovery {...props} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Browser recovery unavailable"
  );
});
