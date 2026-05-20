import { useMemo } from "react";
import { cn } from "@/lib/utils";

// Simple Markdown to HTML converter (no external deps)
function parseMarkdown(md: string): string {
  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm font-mono language-${lang}">${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted/60 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
    // Headings
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-4 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 font-display">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 font-display">$1</h1>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">$1</blockquote>')
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // Unordered lists
    .replace(/^[\*\-] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Tables (basic)
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      return `<tr>${cells.map(c => `<td class="px-3 py-2 border border-border text-sm">${c}</td>`).join("")}</tr>`;
    })
    // Paragraphs
    .replace(/\n\n/g, "</p><p class=\"my-3 leading-relaxed\">")
    .replace(/\n/g, "<br />");

  // Wrap in paragraph
  html = `<p class="my-3 leading-relaxed">${html}</p>`;

  // Fix list items
  html = html
    .replace(/(<li[^>]*>[\s\S]*?<\/li>)/g, (match) => match)
    .replace(/((<li[^>]*>[\s\S]*?<\/li>\s*)+)/g, '<ul class="my-3 space-y-1">$1</ul>');

  // Fix tables
  html = html.replace(/((<tr>[\s\S]*?<\/tr>\s*)+)/g, '<table class="w-full border-collapse my-4">$1</table>');

  return html;
}

type Props = {
  markdown: string;
  className?: string;
};

export default function MarkdownPreview({ markdown, className }: Props) {
  const html = useMemo(() => parseMarkdown(markdown), [markdown]);

  if (!markdown.trim()) {
    return (
      <div className={cn("text-muted-foreground text-sm italic", className)}>
        Nothing to preview yet. Start writing in the editor.
      </div>
    );
  }

  return (
    <div
      className={cn("prose-forge text-foreground text-sm leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
