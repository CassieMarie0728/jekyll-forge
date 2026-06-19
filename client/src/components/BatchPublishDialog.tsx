import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface BatchPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repurposedContentId: number;
  onPublished?: () => void;
}

interface PublishResult {
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  success: boolean;
  postId?: string;
  error?: string;
}

export function BatchPublishDialog({
  open,
  onOpenChange,
  repurposedContentId,
  onPublished,
}: BatchPublishDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Set<"twitter" | "linkedin" | "facebook" | "instagram">
  >(new Set(["twitter", "linkedin", "facebook", "instagram"]));
  const [isPublishing, setIsPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);

  const platforms = [
    { id: "twitter" as const, name: "Twitter/X", icon: Twitter },
    { id: "linkedin" as const, name: "LinkedIn", icon: Linkedin },
    { id: "facebook" as const, name: "Facebook", icon: Facebook },
    { id: "instagram" as const, name: "Instagram", icon: Instagram },
  ];

  const togglePlatform = (
    platform: "twitter" | "linkedin" | "facebook" | "instagram"
  ) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(platform)) {
      newSelected.delete(platform);
    } else {
      newSelected.add(platform);
    }
    setSelectedPlatforms(newSelected);
  };

  const handlePublish = async () => {
    if (selectedPlatforms.size === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setIsPublishing(true);
    setResults([]);

    try {
      // Simulate publishing to selected platforms
      const publishResults: PublishResult[] = [];

      for (const platform of selectedPlatforms) {
        try {
          // In a real implementation, this would call the backend API
          // For now, simulate the publishing process
          await new Promise(resolve => setTimeout(resolve, 1000));

          publishResults.push({
            platform,
            success: true,
            postId: `${platform}_${Date.now()}`,
          });

          toast.success(
            `Published to ${platform === "twitter" ? "Twitter/X" : "LinkedIn"}`
          );
        } catch (error) {
          publishResults.push({
            platform,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          toast.error(`Failed to publish to ${platform}`);
        }
      }

      setResults(publishResults);

      // Check if all succeeded
      const allSucceeded = publishResults.every(r => r.success);
      if (allSucceeded) {
        toast.success("All platforms published successfully!");
        setTimeout(() => {
          onPublished?.();
          onOpenChange(false);
        }, 2000);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Publish to Multiple Platforms</DialogTitle>
          <DialogDescription>
            Publish your content to multiple platforms at once
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Select platforms to publish to:
              </p>
              {platforms.map(platform => {
                const Icon = platform.icon;
                return (
                  <div
                    key={platform.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer"
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <Checkbox
                      checked={selectedPlatforms.has(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{platform.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || selectedPlatforms.size === 0}
                className="flex-1 gap-2"
              >
                {isPublishing ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Publishing...
                  </>
                ) : (
                  `Publish to ${selectedPlatforms.size} Platform${selectedPlatforms.size !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Results */}
            {results.map(result => {
              const platform = platforms.find(p => p.id === result.platform);
              const Icon = platform?.icon;

              return (
                <Card key={result.platform}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          <p className="font-medium">{platform?.name}</p>
                        </div>
                        {result.success ? (
                          <p className="text-sm text-green-600">
                            Published successfully
                          </p>
                        ) : (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Close Button */}
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
