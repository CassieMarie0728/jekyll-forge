import React, { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default function RepositoryInventory() {
  const { siteId } = useParams<{ siteId: string }>();
  const { data: site } = trpc.sites.get.useQuery({ id: Number(siteId) });
  const inventory = trpc.github.inventory.useQuery(
    {
      owner: site?.owner || "",
      repo: site?.repo || "",
      branch: site?.selectedBranch || site?.defaultBranch || "main",
    },
    { enabled: !!site, retry: false }
  );
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [limit, setLimit] = useState(100);
  const classify = (path: string) =>
    /(?:^|\/)_posts\/|(?:^|\/)_drafts\//.test(path) &&
    /\.(md|markdown)$/i.test(path)
      ? "posts"
      : /\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|pdf|mp3|woff2?)$/i.test(path)
        ? "assets"
        : "other";
  const files = inventory.data?.files || [];
  const filtered = files.filter(
    file =>
      file.path.toLowerCase().includes(search.toLowerCase()) &&
      (kind === "all" || classify(file.path) === kind)
  );
  const githubUrl = (path: string) =>
    `https://github.com/${site?.owner}/${site?.repo}/blob/${encodeURIComponent(site?.selectedBranch || site?.defaultBranch || "main")}/${path.split("/").map(encodeURIComponent).join("/")}`;
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Repository inventory</h1>
      <p className="text-sm text-muted-foreground break-all">
        {site?.owner}/{site?.repo} ·{" "}
        {site?.selectedBranch || site?.defaultBranch || "main"}. Read-only
        GitHub inventory; opening a post does not publish or import it. Forge
        dashboard counts cover saved Forge records.
      </p>
      {inventory.isPending && <p>Loading repository files…</p>}
      {inventory.isError && (
        <div role="alert">
          Could not load repository files.
          <Button onClick={() => inventory.refetch()}>Retry</Button>
        </div>
      )}
      {inventory.data?.truncated && (
        <p role="alert">
          GitHub returned a partial tree for this large repository. Counts and
          search cover only the files returned.
        </p>
      )}
      {inventory.isSuccess && (
        <p>
          {files.length} files ·{" "}
          {files.filter(f => classify(f.path) === "posts").length} posts/drafts
          · {files.filter(f => classify(f.path) === "assets").length}{" "}
          media/assets
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Search repository files"
          placeholder="Search paths…"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setLimit(100);
          }}
        />
        <select
          aria-label="File type"
          className="bg-background border rounded p-2"
          value={kind}
          onChange={e => {
            setKind(e.target.value);
            setLimit(100);
          }}
        >
          <option value="all">All files</option>
          <option value="posts">Posts and drafts</option>
          <option value="assets">Media and assets</option>
          <option value="other">Other files</option>
        </select>
        <Button variant="outline" onClick={() => inventory.refetch()}>
          Refresh
        </Button>
      </div>
      <p className="text-xs">{filtered.length} matches</p>
      <ul className="divide-y">
        {filtered.slice(0, limit).map(file => (
          <li
            key={file.path}
            className="py-3 flex flex-wrap gap-3 items-center"
          >
            <span className="flex-1 min-w-0 break-all text-sm">
              {file.path}
            </span>
            {classify(file.path) === "posts" && (
              <Link
                className="text-sm underline"
                href={`/editor/${siteId}/${encodeURIComponent(file.path)}`}
              >
                Open in editor
              </Link>
            )}
            <a
              className="text-sm underline"
              href={githubUrl(file.path)}
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
          </li>
        ))}
      </ul>
      {filtered.length > limit && (
        <Button onClick={() => setLimit(n => n + 100)}>Show more</Button>
      )}
    </div>
  );
}
