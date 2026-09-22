import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  generate: vi.fn(),
  generated: undefined as any,
}));
vi.mock("wouter", () => ({ useParams: () => ({ siteId: "2" }) }));
vi.mock("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({ activeSite: { id: 2 } }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    assets: {
      list: {
        useQuery: () => ({
          data: [
            {
              id: 9,
              name: "sample.png",
              path: "/assets/sample.png",
              storageUrl: "https://example.test/sample.png",
              mimeType: "image/png",
              size: 20,
              alt: "Old description",
              width: null,
              height: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          refetch: vi.fn(),
        }),
      },
      delete: { useMutation: () => ({ mutate: vi.fn() }) },
      update: { useMutation: () => ({ mutate: mocks.save }) },
      generateAltText: {
        useMutation: (options: any) => {
          mocks.generated = options.onSuccess;
          return { mutate: mocks.generate };
        },
      },
      upload: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));
import AssetManager from "./AssetManager";
describe("asset descriptions", () => {
  it("sends manually edited alt text to the save endpoint", () => {
    render(<AssetManager />);
    fireEvent.click(screen.getByAltText("Old description"));
    fireEvent.change(screen.getByRole("textbox", { name: "Image alt text" }), {
      target: { value: "An actual description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save alt text" }));
    expect(mocks.save).toHaveBeenCalledWith({
      id: 9,
      alt: "An actual description",
    });
  });
});
