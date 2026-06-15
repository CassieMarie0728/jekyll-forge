import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SocialPostPreview } from "./SocialPostPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  scheduledAt?: Date;
  accountName?: string;
  platforms?: Array<"twitter" | "linkedin" | "facebook" | "instagram">;
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * Post Preview Dialog
 * Shows previews of how the post will appear on selected platforms
 * Allows user to review before confirming publish/schedule
 */
export const PostPreviewDialog: React.FC<PostPreviewDialogProps> = ({
  open,
  onOpenChange,
  content,
  scheduledAt,
  accountName = "Your Account",
  platforms = ["twitter", "linkedin", "facebook", "instagram"],
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview Your Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Content:</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{content}</p>
            {scheduledAt && (
              <p className="text-xs text-slate-500 mt-2">
                Scheduled for:{" "}
                {new Date(scheduledAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {/* Platform Previews */}
          {platforms.length > 1 ? (
            <Tabs defaultValue={platforms[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(platforms.length, 4)}, 1fr)` }}>
                {platforms.map((platform) => (
                  <TabsTrigger key={platform} value={platform} className="capitalize">
                    {platform}
                  </TabsTrigger>
                ))}
              </TabsList>

              {platforms.map((platform) => (
                <TabsContent key={platform} value={platform} className="flex justify-center mt-4">
                  <SocialPostPreview
                    platform={platform}
                    content={content}
                    scheduledAt={scheduledAt}
                    accountName={accountName}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex justify-center">
              <SocialPostPreview
                platform={platforms[0]}
                content={content}
                scheduledAt={scheduledAt}
                accountName={accountName}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Processing..." : scheduledAt ? "Schedule Post" : "Publish Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostPreviewDialog;
