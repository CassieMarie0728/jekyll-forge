import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const homeSource = readFileSync(
  resolve(projectRoot, "client/src/pages/Home.tsx"),
  "utf8"
);
const appSource = readFileSync(
  resolve(projectRoot, "client/src/App.tsx"),
  "utf8"
);

describe("public navigation contracts", () => {
  it("keeps the primary landing CTAs tied to the supported auth helpers and workflow target", () => {
    expect(homeSource).toContain("getLoginUrl()");
    expect(homeSource).toContain("getSignUpUrl()");
    expect(homeSource).toContain('id="workflow-overview"');
    expect(homeSource).toContain(
      'document.getElementById("workflow-overview")'
    );
  });

  it("registers each current authenticated workspace route behind the shared application layout", () => {
    [
      "/repos",
      "/dashboard/:siteId",
      "/editor/:siteId",
      "/assets/:siteId",
      "/scheduler/:siteId",
      "/themes/:siteId",
      "/health/:siteId",
      "/ai-settings/:siteId",
      "/social-analytics/:siteId",
      "/settings",
    ].forEach(path => {
      expect(appSource).toContain(`path="${path}"`);
    });

    expect(appSource).toContain("<AppLayout>");
    expect(appSource).toContain("<Route component={NotFound} />");
  });
});
