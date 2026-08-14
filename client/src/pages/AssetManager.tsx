import { useState, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload,
  Search,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Trash2,
  Copy,
  Wand2,
  Download,
  Grid3X3,
  List,
  Filter,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
// Local type to avoid importing from drizzle/schema on the client
type Asset = {
  id: number;
  name: string;
  path: string;
  storageUrl: string | null;
  mimeType: string | null;
  size: number | null;
  alt?: string | null;
  width: number | null;
  height: number | null;
  isDuplicate?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAssetType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return "document";
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return "archive";
  return "other";
}

const TYPE_ICONS: Record<string, typeof Image> = {
  image: Image,
  audio: Music,
  video: Video,
  document: FileText,
  archive: Archive,
  other: FileText,
};

export default function AssetManager() {
  const { siteId } = useParams<{ siteId: string }>();
  const { activeSite } = useWorkspace();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: assets,
    isLoading,
    refetch,
  } = trpc.assets.list.useQuery({ siteId: Number(siteId) });
  const deleteAsset = trpc.assets.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Asset deleted");
    },
  });
  const generateAltText = trpc.assets.generateAltText.useMutation({
    onSuccess: data => {
      toast.success(`Alt text generated: "${data.altText}"`);
      refetch();
    },
    onError: err => toast.error(err.message),
  });
  const uploadMutation = trpc.assets.upload.useMutation({
    onSuccess: data => {
      refetch();
      if (data.isDuplicate)
        toast.warning("Duplicate detected — existing asset returned");
      else if ((data as { sizeWarning?: string }).sizeWarning)
        toast.warning((data as { sizeWarning?: string }).sizeWarning!);
      else toast.success(`Uploaded: ${data.name}`);
    },
    onError: err => toast.error(err.message),
  });

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        const reader = new FileReader();
        await new Promise<void>(resolve => {
          reader.onload = async e => {
            const base64 = (e.target?.result as string).split(",")[1];
            const img = new window.Image();
            let width: number | undefined, height: number | undefined;
            if (file.type.startsWith("image/")) {
              await new Promise<void>(res => {
                img.onload = () => {
                  width = img.width;
                  height = img.height;
                  res();
                };
                img.src = e.target?.result as string;
              });
            }
            await uploadMutation.mutateAsync({
              siteId: Number(siteId),
              name: file.name,
              path: `/assets/images/${file.name}`,
              base64Content: base64,
              mimeType: file.type,
              size: file.size,
              width,
              height,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      setUploading(false);
    },
    [siteId, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const filtered =
    assets?.filter(
      a =>
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.path.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const images = filtered.filter(a => a.mimeType?.startsWith("image/"));
  const others = filtered.filter(a => !a.mimeType?.startsWith("image/"));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Asset Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assets?.length || 0} assets · S3-backed storage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid3X3 className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.zip,.mp3,.mp4"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        )}
      >
        <Upload
          className={cn(
            "w-8 h-8 mx-auto mb-2",
            dragOver ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p className="text-sm text-muted-foreground">
          {dragOver
            ? "Drop files here"
            : "Drag & drop files here, or click Upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Images, PDFs, ZIPs, audio — max 10MB each
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search assets..."
          className="pl-9 bg-card"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No assets yet</p>
          <p className="text-xs mt-1">Upload images, PDFs, and other files</p>
        </div>
      ) : (
        <>
          {images.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Images ({images.length})
              </h2>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
                    : "space-y-2"
                )}
              >
                {images.map(asset =>
                  viewMode === "grid" ? (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary/30 transition-all"
                    >
                      <img
                        src={asset.storageUrl || ""}
                        alt={asset.alt || asset.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white"
                          onClick={e => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              asset.storageUrl || ""
                            );
                            toast.success("URL copied");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white"
                          onClick={e => {
                            e.stopPropagation();
                            deleteAsset.mutate({ id: asset.id });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {!asset.alt && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-forge-amber flex items-center justify-center">
                          <AlertCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={asset.id}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors"
                    >
                      <img
                        src={asset.storageUrl || ""}
                        alt={asset.alt || asset.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {asset.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(asset.size || 0)} · {asset.width}×
                          {asset.height}
                        </div>
                        {asset.alt && (
                          <div className="text-xs text-muted-foreground truncate">
                            Alt: {asset.alt}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              asset.storageUrl || ""
                            );
                            toast.success("URL copied");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteAsset.mutate({ id: asset.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Other Files ({others.length})
              </h2>
              <div className="space-y-2">
                {others.map(asset => {
                  const type = getAssetType(asset.mimeType || "");
                  const Icon = TYPE_ICONS[type] || FileText;
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {asset.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(asset.size || 0)} · {asset.mimeType}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              asset.storageUrl || ""
                            );
                            toast.success("URL copied");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteAsset.mutate({ id: asset.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Asset Detail Dialog */}
      <Dialog
        open={!!selectedAsset}
        onOpenChange={v => !v && setSelectedAsset(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {selectedAsset?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                {selectedAsset.mimeType?.startsWith("image/") ? (
                  <img
                    src={selectedAsset.storageUrl || ""}
                    alt={selectedAsset.alt || selectedAsset.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <FileText className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    File Name
                  </Label>
                  <p className="font-medium truncate">{selectedAsset.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <p>{formatBytes(selectedAsset.size || 0)}</p>
                </div>
                {selectedAsset.width && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Dimensions
                    </Label>
                    <p>
                      {selectedAsset.width} × {selectedAsset.height}px
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Alt Text
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedAsset.alt || ""}
                      onChange={e =>
                        setSelectedAsset({
                          ...selectedAsset,
                          alt: e.target.value,
                        })
                      }
                      placeholder="Describe this image..."
                      className="h-7 text-xs flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 flex-shrink-0"
                      onClick={() =>
                        generateAltText.mutate({
                          assetId: selectedAsset.id,
                        })
                      }
                      disabled={generateAltText.isPending}
                    >
                      {generateAltText.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      AI
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Storage URL
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      value={selectedAsset.storageUrl || ""}
                      readOnly
                      className="h-7 text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          selectedAsset.storageUrl || ""
                        );
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Markdown Embed
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      value={`![${selectedAsset.alt || selectedAsset.name}](${selectedAsset.storageUrl})`}
                      readOnly
                      className="h-7 text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `![${selectedAsset.alt || selectedAsset.name}](${selectedAsset.storageUrl})`
                        );
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
