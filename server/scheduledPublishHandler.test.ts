import { describe, expect, it, vi, afterEach } from "vitest";
import { testDatabase, testEnv } from "./test/d1";
import { withRuntime } from "./_core/runtime";
import { processScheduledPosts } from "./scheduledPublishHandler";
import { consumeLimit } from "./_core/limits";

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  const database = testDatabase();
  database.sqlite.exec(
    "INSERT INTO users(id,openId,githubToken) VALUES(7,'github:7','test-pat'); INSERT INTO sites(id,userId,owner,repo) VALUES(1,7,'test-owner','test-repo'); INSERT INTO scheduled_posts(userId,siteId,draftPath,targetPath,branch,scheduledAt) VALUES(7,1,'_drafts/test.md','_posts/test.md','draft-branch',1);"
  );
  return database;
}
describe("durable scheduled publication", () => {
  it("claims once across overlapping invocations and writes only the saved branch", async () => {
    const database = fixture();
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        calls.push({ url, init });
        return Response.json(
          init?.method ? {} : { content: "aGVsbG8=", sha: "draft-sha" }
        );
      })
    );
    await withRuntime(testEnv(database.binding), async () => {
      await Promise.all([processScheduledPosts(), processScheduledPosts()]);
      expect(calls.filter(c => c.init?.method === "PUT")).toHaveLength(1);
      expect(
        JSON.parse(
          calls.find(c => c.init?.method === "PUT")!.init!.body as string
        )
      ).toMatchObject({ branch: "draft-branch" });
      expect(
        JSON.parse(
          calls.find(c => c.init?.method === "PUT")!.init!.body as string
        )
      ).not.toHaveProperty("sha");
      expect(
        database.sqlite.prepare("SELECT status FROM scheduled_posts").get()
          ?.status
      ).toBe("published");
    });
    database.sqlite.close();
  });
  it("keeps the draft when GitHub rejects an existing target and records failure", async () => {
    const database = fixture();
    const mocked = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ content: "aGVsbG8=", sha: "draft-sha" })
      )
      .mockResolvedValueOnce(
        Response.json({ message: "conflict" }, { status: 422 })
      );
    vi.stubGlobal("fetch", mocked);
    await withRuntime(testEnv(database.binding), processScheduledPosts);
    expect(mocked).toHaveBeenCalledTimes(2);
    expect(
      database.sqlite.prepare("SELECT status FROM scheduled_posts").get()
        ?.status
    ).toBe("failed");
    expect(
      database.sqlite
        .prepare("SELECT count(*) AS n FROM operator_notifications")
        .get()?.n
    ).toBe(1);
    database.sqlite.close();
  });
  it("atomically limits concurrent callers in persistent storage", async () => {
    const database = fixture();
    await withRuntime(testEnv(database.binding), async () => {
      const permitted = await Promise.all(
        Array.from({ length: 12 }, () => consumeLimit("test", 3, 60))
      );
      expect(permitted.filter(Boolean)).toHaveLength(3);
    });
    database.sqlite.close();
  });
});
