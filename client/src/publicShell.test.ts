import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public HTML shell", () => {
  it("keeps mobile zoom available and exposes accountable metadata", () => {
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

    expect(html).toContain('name="viewport"');
    expect(html).not.toContain("maximum-scale");
    expect(html).toContain('name="description"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
  });
});
