import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Copy, RefreshCw, Check, Twitter, Linkedin, Share2, Youtube, Mail, Podcast, Presentation, MessageSquare, Zap } from "lucide-react";
import { SocialMediaPanel } from "./SocialMediaPanel";
import { BatchPublishDialog } from "./BatchPublishDialog";

type RepurposingFormat = "twitter" | "linkedin" | "tiktok" | "youtube" | "newsletter" | "email" | "podcast" | "slides";

interface RepurposingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  repurposedContentId?: number; // ID of the repurposed content record
  siteId: number;
  postTitle: string;
}

const FORMAT_CONFIG: Record<RepurposingFormat, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  twitter: {
    label: "Twitter Thread",
    icon: <Twitter className="w-4 h-4" />,
    description: "5-7 engaging tweets",
    color: "bg-blue-50 border-blue-200",
  },
  linkedin: {
    label: "LinkedIn Article",
    icon: <Linkedin className="w-4 h-4" />,
    description: "Professional article",
    color: "bg-blue-50 border-blue-200",
  },
  tiktok: {
    label: "TikTok Script",
    icon: <Share2 className="w-4 h-4" />,
    description: "30-60 second video script",
    color: "bg-black/5 border-black/10",
  },
  youtube: {
    label: "YouTube Description",
    icon: <Youtube className="w-4 h-4" />,
    description: "Video description & chapters",
    color: "bg-red-50 border-red-200",
  },
  newsletter: {
    label: "Newsletter",
    icon: <Mail className="w-4 h-4" />,
    description: "Newsletter excerpt",
    color: "bg-purple-50 border-purple-200",
  },
  email: {
    label: "Email Campaign",
    icon: <Mail className="w-4 h-4" />,
    description: "3-email sequence",
    color: "bg-orange-50 border-orange-200",
  },
  podcast: {
    label: "Podcast Outline",
    icon: <Podcast className="w-4 h-4" />,
    description: "15-20 minute outline",
    color: "bg-green-50 border-green-200",
  },
  slides: {
    label: "Slide Deck",
    icon: <Presentation className="w-4 h-4" />,
    description: "8-12 slide outline",
    color: "bg-indigo-50 border-indigo-200",
  },
};

export function RepurposingModal({
  open,
  onOpenChange,
  postId,
  repurposedContentId,
  siteId,
  postTitle,
}: RepurposingModalProps) {
  const [activeFormat, setActiveFormat] = useState<RepurposingFormat>("twitter");
  const [generatedContent, setGeneratedContent] = useState<Record<RepurposingFormat, string>>({} as any);
  const [loadingFormat, setLoadingFormat] = useState<RepurposingFormat | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBatchPublish, setShowBatchPublish] = useState(false);

  const generateMutation = trpc.repurposing.generate.useMutation();
  const getByPostQuery = trpc.repurposing.getByPost.useQuery({ postId }, { enabled: open });

  const handleGenerate = async (format: RepurposingFormat) => {
    setLoadingFormat(format);
    try {
      const result = await generateMutation.mutateAsync({
        postId,
        siteId,
        format,
      });
      setGeneratedContent((prev) => ({
        ...prev,
        [format]: result.content,
      }));
      toast.success(`${FORMAT_CONFIG[format].label} generated successfully!`);
    } catch (error) {
      toast.error(`Failed to generate ${FORMAT_CONFIG[format].label}`);
      console.error(error);
    } finally {
      setLoadingFormat(null);
    }
  };

  const handleCopy = (text: string, format: RepurposingFormat) => {
    navigator.clipboard.writeText(text);
    setCopiedId(format);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formats: RepurposingFormat[] = ["twitter", "linkedin", "tiktok", "youtube", "newsletter", "email", "podcast", "slides"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Repurpose Content
          </DialogTitle>
          <DialogDescription>
            Transform "{postTitle}" into multiple formats for different platforms
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="twitter" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 mb-4">
            {formats.map((format) => (
              <TabsTrigger
                key={format}
                value={format}
                className="text-xs"
                onClick={() => setActiveFormat(format)}
              >
                {FORMAT_CONFIG[format].icon}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="social"
              className="text-xs"
              onClick={() => setActiveFormat("twitter")}
            >
              <Share2 className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-4">
            {repurposedContentId ? (
              <SocialMediaPanel repurposedContentId={repurposedContentId} format={activeFormat} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Generate content first to enable social media publishing</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {formats.map((format) => (
            <TabsContent key={format} value={format} className="space-y-4">
              <Card className={FORMAT_CONFIG[format].color}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {FORMAT_CONFIG[format].icon}
                    {FORMAT_CONFIG[format].label}
                  </CardTitle>
                  <CardDescription>{FORMAT_CONFIG[format].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedContent[format] ? (
                    <>
                      <div className="bg-white rounded-lg border p-4 min-h-[300px] max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm font-mono">
                        {generatedContent[format]}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopy(generatedContent[format], format)}
                          variant="outline"
                          className="gap-2"
                        >
                          {copiedId === format ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleGenerate(format)}
                          variant="outline"
                          className="gap-2"
                          disabled={loadingFormat === format}
                        >
                          {loadingFormat === format ? (
                            <>
                              <Spinner className="w-4 h-4" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No content generated yet</p>
                      <Button
                        onClick={() => handleGenerate(format)}
                        disabled={loadingFormat === format}
                        className="gap-2"
                      >
                        {loadingFormat === format ? (
                          <>
                            <Spinner className="w-4 h-4" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            Generate {FORMAT_CONFIG[format].label}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-between gap-2 pt-4">
          <Button
            onClick={() => setShowBatchPublish(true)}
            variant="default"
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Batch Publish
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        {/* Batch Publish Dialog */}
        <BatchPublishDialog
          open={showBatchPublish}
          onOpenChange={setShowBatchPublish}
          repurposedContentId={postId}
        />
      </DialogContent>
    </Dialog>
  );
}
