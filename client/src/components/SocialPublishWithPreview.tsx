import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostPreviewDialog } from "./PostPreviewDialog";
import { SocialPostPreview } from "./SocialPostPreview";
import { toast } from "sonner";
import { Calendar, Send, Eye } from "lucide-react";

interface SocialPublishWithPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onContentChange?: (content: string) => void;
  platforms?: Array<"twitter" | "linkedin" | "facebook" | "instagram">;
  onPublish?: (data: {
    content: string;
    platforms: string[];
    scheduledAt?: Date;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const SocialPublishWithPreview: React.FC<SocialPublishWithPreviewProps> = ({
  open,
  onOpenChange,
  content,
  onContentChange,
  platforms = ["twitter", "linkedin"],
  onPublish,
  isLoading = false,
}) => {
  const [localContent, setLocalContent] = useState(content);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(platforms)
  );
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [showPreview, setShowPreview] = useState(false);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<
    "twitter" | "linkedin" | "facebook" | "instagram"
  >("twitter");

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange?.(newContent);
  };

  const togglePlatform = (platform: string) => {
    const newSet = new Set(selectedPlatforms);
    if (newSet.has(platform)) {
      newSet.delete(platform);
    } else {
      newSet.add(platform);
    }
    setSelectedPlatforms(newSet);
  };

  const handlePublish = async () => {
    if (!localContent.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    if (selectedPlatforms.size === 0) {
      toast.error("Select at least one platform");
      return;
    }

    try {
      await onPublish?.({
        content: localContent,
        platforms: Array.from(selectedPlatforms),
        scheduledAt:
          scheduleMode === "later" ? new Date(scheduledDate) : undefined,
      });

      toast.success(
        scheduleMode === "later"
          ? "Post scheduled successfully!"
          : "Post published successfully!"
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish post"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Publish to Social Media
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            {/* Compose Tab */}
            <TabsContent value="compose" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Content
                </Label>
                <Textarea
                  value={localContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your social media post..."
                  className="min-h-32"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {localContent.length} characters
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Platforms
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {["twitter", "linkedin", "facebook", "instagram"].map(
                    (platform) => (
                      <Button
                        key={platform}
                        variant={
                          selectedPlatforms.has(platform)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => togglePlatform(platform)}
                        className="capitalize"
                      >
                        {platform}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Select Platform to Preview
                </Label>
                <Select
                  value={activePreviewPlatform}
                  onValueChange={(value: any) =>
                    setActivePreviewPlatform(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(selectedPlatforms).map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {(platform as string).charAt(0).toUpperCase() +
                          (platform as string).slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center py-4">
                <SocialPostPreview
                  platform={activePreviewPlatform}
                  content={localContent}
                  accountName="Your Account"
                />
              </div>

              <p className="text-xs text-slate-500 text-center">
                This is how your post will appear on{" "}
                {activePreviewPlatform.charAt(0).toUpperCase() +
                  activePreviewPlatform.slice(1)}
              </p>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Publishing Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={scheduleMode === "now" ? "default" : "outline"}
                      onClick={() => setScheduleMode("now")}
                      className="flex-1"
                    >
                      Publish Now
                    </Button>
                    <Button
                      variant={
                        scheduleMode === "later" ? "default" : "outline"
                      }
                      onClick={() => setScheduleMode("later")}
                      className="flex-1"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule for Later
                    </Button>
                  </div>

                  {scheduleMode === "later" && (
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Scheduled Date & Time
                      </Label>
                      <input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      {scheduleMode === "now"
                        ? "Your post will be published immediately to all selected platforms."
                        : `Your post will be published on ${new Date(scheduledDate).toLocaleDateString()} at ${new Date(scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              Full Preview
            </Button>
            <Button onClick={handlePublish} disabled={isLoading}>
              {isLoading
                ? "Publishing..."
                : scheduleMode === "now"
                  ? "Publish Now"
                  : "Schedule Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <PostPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        content={localContent}
        platforms={Array.from(selectedPlatforms) as any}
        scheduledAt={
          scheduleMode === "later" ? new Date(scheduledDate) : undefined
        }
        onConfirm={handlePublish}
        isLoading={isLoading}
      />
    </>
  );
};

export default SocialPublishWithPreview;
