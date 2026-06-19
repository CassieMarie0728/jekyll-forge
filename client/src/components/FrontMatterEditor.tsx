import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  Calendar,
  Layout,
  Image,
  Globe,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  frontMatter: Record<string, unknown>;
  onChange: (fm: Record<string, unknown>) => void;
  siteId: number;
};

const STANDARD_FIELDS = [
  { key: "title", label: "Title", icon: Hash, type: "string" },
  {
    key: "layout",
    label: "Layout",
    icon: Layout,
    type: "select",
    options: ["post", "page", "default", "home"],
  },
  { key: "date", label: "Date", icon: Calendar, type: "string" },
  { key: "author", label: "Author", icon: Globe, type: "string" },
  { key: "excerpt", label: "Excerpt", icon: Hash, type: "textarea" },
  { key: "description", label: "Description", icon: Hash, type: "textarea" },
  { key: "image", label: "Featured Image", icon: Image, type: "string" },
  { key: "permalink", label: "Permalink", icon: Globe, type: "string" },
  { key: "published", label: "Published", icon: Globe, type: "boolean" },
  { key: "comments", label: "Comments", icon: Globe, type: "boolean" },
];

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
            {tag}
            <button
              onClick={() => onChange(value.filter(t => t !== tag))}
              className="hover:text-destructive"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add tag..."
          className="h-7 text-xs"
        />
        <Button variant="outline" size="sm" className="h-7 px-2" onClick={add}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function FrontMatterEditor({
  frontMatter,
  onChange,
  siteId,
}: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    standard: true,
    seo: false,
    custom: false,
  });

  const update = (key: string, value: unknown) =>
    onChange({ ...frontMatter, [key]: value });
  const remove = (key: string) => {
    const copy = { ...frontMatter };
    delete copy[key];
    onChange(copy);
  };

  const customKeys = Object.keys(frontMatter).filter(
    k =>
      !STANDARD_FIELDS.map(f => f.key).includes(k) &&
      k !== "tags" &&
      k !== "categories"
  );

  const toggleSection = (s: keyof typeof expandedSections) =>
    setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  const SectionHeader = ({
    label,
    section,
  }: {
    label: string;
    section: keyof typeof expandedSections;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {label}
      {expandedSections[section] ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="text-sm">
      <div className="px-3 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Front Matter
        </span>
      </div>

      {/* Standard Fields */}
      <SectionHeader label="Post Fields" section="standard" />
      {expandedSections.standard && (
        <div className="px-3 pb-3 space-y-3">
          {STANDARD_FIELDS.map(({ key, label, type, options }) => {
            const val = frontMatter[key];
            return (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {label}
                </Label>
                {type === "boolean" ? (
                  <Switch
                    checked={Boolean(val)}
                    onCheckedChange={v => update(key, v)}
                    className="scale-75 origin-left"
                  />
                ) : type === "select" ? (
                  <Select
                    value={String(val || "")}
                    onValueChange={v => update(key, v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.map(o => (
                        <SelectItem key={o} value={o} className="text-xs">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : type === "textarea" ? (
                  <Textarea
                    value={String(val || "")}
                    onChange={e => update(key, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    className="text-xs min-h-[60px] resize-none"
                    rows={3}
                  />
                ) : (
                  <Input
                    value={String(val || "")}
                    onChange={e => update(key, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    className="h-7 text-xs"
                  />
                )}
              </div>
            );
          })}

          {/* Tags */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </Label>
            <TagInput
              value={
                Array.isArray(frontMatter.tags)
                  ? (frontMatter.tags as string[])
                  : []
              }
              onChange={v => update("tags", v)}
            />
          </div>

          {/* Categories */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Categories
            </Label>
            <TagInput
              value={
                Array.isArray(frontMatter.categories)
                  ? (frontMatter.categories as string[])
                  : []
              }
              onChange={v => update("categories", v)}
            />
          </div>
        </div>
      )}

      <Separator />

      {/* SEO Fields */}
      <SectionHeader label="SEO" section="seo" />
      {expandedSections.seo && (
        <div className="px-3 pb-3 space-y-3">
          {[
            { key: "seo_title", label: "SEO Title" },
            { key: "meta_description", label: "Meta Description" },
            { key: "canonical_url", label: "Canonical URL" },
            { key: "robots", label: "Robots" },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {label}
              </Label>
              <Input
                value={String(frontMatter[key] || "")}
                onChange={e => update(key, e.target.value || undefined)}
                placeholder={`Enter ${label.toLowerCase()}...`}
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Custom Fields */}
      <SectionHeader
        label={`Custom Fields (${customKeys.length})`}
        section="custom"
      />
      {expandedSections.custom && (
        <div className="px-3 pb-3 space-y-2">
          {customKeys.map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {key}
                </div>
                <Input
                  value={String(frontMatter[key] || "")}
                  onChange={e => update(key, e.target.value)}
                  className="h-6 text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 mt-4"
                onClick={() => remove(key)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {/* Add Custom Field */}
          <div className="space-y-1.5 pt-1">
            <div className="flex gap-1">
              <Input
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="key"
                className="h-6 text-xs flex-1"
              />
              <Input
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                placeholder="value"
                className="h-6 text-xs flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => {
                  if (!newKey.trim()) return;
                  update(newKey.trim(), newVal);
                  setNewKey("");
                  setNewVal("");
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
