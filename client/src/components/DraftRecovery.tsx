import React, { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { serializeToMarkdown } from "@/lib/editorMarkdown";

export type RecoveryDraft = {
  key: string;
  path: string | null;
  postId: number | null;
  sha?: string;
  markdown: string;
  frontMatter: Record<string, unknown>;
  updatedAt: string;
};
type Props = {
  siteId: number;
  path: string | null;
  postId: number | null;
  sha?: string;
  markdown: string;
  frontMatter: Record<string, unknown>;
  dirty: boolean;
  onRestore: (draft: RecoveryDraft) => void;
};
export default function DraftRecovery(props: Props) {
  const { data: user } = trpc.auth.me.useQuery();
  const [drafts, setDrafts] = useState<RecoveryDraft[]>([]);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const prefix = user ? `forge:recovery:${user.id}:${props.siteId}:` : null;
  const current = useRef({ identity: "", key: "" });
  function refresh() {
    if (!prefix) {
      setDrafts([]);
      return;
    }
    try {
      const found: RecoveryDraft[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const value = JSON.parse(localStorage.getItem(key) || "null");
          if (
            value &&
            typeof value.markdown === "string" &&
            value.frontMatter &&
            typeof value.frontMatter === "object" &&
            typeof value.updatedAt === "string"
          )
            found.push({ ...value, key });
        } catch {
          /* Leave unreadable records intact. */
        }
      }
      setDrafts(found.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    refresh();
    const update = () => refresh();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [prefix]);
  useEffect(() => {
    if (!props.dirty) {
      current.current = { identity: "", key: "" };
      return;
    }
    if (!prefix) return;
    const identity = `${prefix}:${props.path}`;
    if (current.current.identity !== identity)
      current.current = { identity, key: `${prefix}${crypto.randomUUID()}` };
    try {
      const draft: RecoveryDraft = {
        key: current.current.key,
        path: props.path,
        postId: props.postId,
        sha: props.sha,
        markdown: props.markdown,
        frontMatter: props.frontMatter,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draft.key, JSON.stringify(draft));
      setError(false);
      refresh();
    } catch {
      setError(true);
    }
  }, [
    prefix,
    props.path,
    props.postId,
    props.sha,
    props.markdown,
    props.frontMatter,
    props.dirty,
  ]);
  function download(draft: RecoveryDraft) {
    const url = URL.createObjectURL(
      new Blob([serializeToMarkdown(draft.frontMatter, draft.markdown)], {
        type: "text/markdown",
      })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-recovery.md";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="border-b px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            refresh();
            setExpanded(!expanded);
          }}
          aria-expanded={expanded}
        >
          Recovery drafts ({drafts.length})
        </Button>
        <span role="status">
          {error
            ? "Browser recovery unavailable — save in Forge or download your work."
            : props.dirty && user
              ? "Recovery copy saved on this browser"
              : "Recovery stays on this browser; Save stores the draft in Forge."}
        </span>
      </div>
      {error && (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            download({
              key: "",
              path: props.path,
              postId: props.postId,
              markdown: props.markdown,
              frontMatter: props.frontMatter,
              updatedAt: new Date().toISOString(),
            })
          }
        >
          Download current draft
        </Button>
      )}
      {expanded && (
        <div className="max-h-48 overflow-auto space-y-2">
          {drafts.length === 0 && <p>No recovery copies yet.</p>}
          {drafts.map(draft => (
            <div
              key={draft.key}
              className="flex flex-wrap items-center gap-2 rounded border p-2"
            >
              <span className="flex-1 break-all">
                {String(draft.frontMatter.title || "Untitled draft")} ·{" "}
                {new Date(draft.updatedAt).toLocaleString()}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => props.onRestore(draft)}
              >
                Restore
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => download(draft)}
              >
                Download
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this browser recovery copy? This does not delete the Forge or GitHub post."
                    )
                  ) {
                    try {
                      localStorage.removeItem(draft.key);
                      refresh();
                    } catch {
                      setError(true);
                    }
                  }
                }}
              >
                Delete copy
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
