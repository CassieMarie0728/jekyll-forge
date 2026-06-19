import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Zap, TrendingUp, Copy, CheckCircle2, AlertCircle } from "lucide-react";

interface AbTestingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  headline: string;
  content: string;
  onTestStarted?: () => void;
}

export function AbTestingModal({
  open,
  onOpenChange,
  postId,
  headline,
  content,
  onTestStarted,
}: AbTestingModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Set<number>>(
    new Set()
  );
  const [publishPlatforms, setPublishPlatforms] = useState<Set<string>>(
    new Set(["twitter", "linkedin"])
  );

  const generateVariationsMutation =
    trpc.abTesting.generateVariations.useMutation();
  const publishVariationMutation =
    trpc.abTesting.publishVariation.useMutation();
  const getResultsQuery = trpc.abTesting.getResults.useQuery(
    { postId },
    { enabled: open }
  );

  const handleGenerateVariations = async () => {
    setIsGenerating(true);
    try {
      await generateVariationsMutation.mutateAsync({
        postId,
        headline,
        content,
        count: 3,
      });
      toast.success("Variations generated successfully!");
      onTestStarted?.();
      setSelectedVariations(new Set([1, 2, 3]));
    } catch (error) {
      toast.error("Failed to generate variations");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishVariations = async () => {
    if (selectedVariations.size === 0) {
      toast.error("Select at least one variation to publish");
      return;
    }

    try {
      for (const variationIndex of selectedVariations) {
        await publishVariationMutation.mutateAsync({
          postId,
          variationIndex,
          platforms: Array.from(publishPlatforms) as any[],
        });
      }
      toast.success("Variations published successfully!");
    } catch (error) {
      toast.error("Failed to publish variations");
    }
  };

  const toggleVariation = (index: number) => {
    const newSelected = new Set(selectedVariations);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedVariations(newSelected);
  };

  const togglePlatform = (platform: string) => {
    const newPlatforms = new Set(publishPlatforms);
    if (newPlatforms.has(platform)) {
      newPlatforms.delete(platform);
    } else {
      newPlatforms.add(platform);
    }
    setPublishPlatforms(newPlatforms);
  };

  const variations = generateVariationsMutation.data?.variations || [];
  const testResults = getResultsQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            A/B Test Content Variations
          </DialogTitle>
          <DialogDescription>
            Generate and test multiple variations of your post to find the most
            engaging version
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            {variations.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Generate Variations</CardTitle>
                  <CardDescription>
                    Create 3 variations of your post with different tones and
                    angles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How A/B Testing Works</p>
                      <p>
                        We'll generate 3 variations with different tones
                        (professional, casual, humorous) and angles
                        (beginner-friendly, advanced, contrarian). You can then
                        publish them to test which resonates most with your
                        audience.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateVariations}
                    disabled={isGenerating}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Spinner className="w-4 h-4" />
                        Generating Variations...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate 3 Variations
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">
                    {variations.length} variations generated
                  </span>
                </div>

                {variations.map((variation, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {variation.headline}
                          </CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{variation.tone}</Badge>
                            <Badge variant="outline">{variation.angle}</Badge>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedVariations.has(
                            variation.variationIndex
                          )}
                          onChange={() =>
                            toggleVariation(variation.variationIndex)
                          }
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {variation.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish" className="space-y-4">
            {variations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Generate variations first to publish them
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Platforms</CardTitle>
                    <CardDescription>
                      Choose which platforms to publish your variations to
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {["twitter", "linkedin", "facebook", "instagram"].map(
                      platform => (
                        <label
                          key={platform}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={publishPlatforms.has(platform)}
                            onChange={() => togglePlatform(platform)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="capitalize font-medium">
                            {platform}
                          </span>
                        </label>
                      )
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handlePublishVariations}
                  disabled={
                    publishVariationMutation.isPending ||
                    selectedVariations.size === 0
                  }
                  className="w-full gap-2"
                  size="lg"
                >
                  {publishVariationMutation.isPending ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Publish {selectedVariations.size} Variation(s)
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {!testResults || testResults.results.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No test results yet. Publish variations to start tracking
                    metrics.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {testResults.results.map((result, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Variation {result.variationIndex}
                        </CardTitle>
                        <Badge>{result.platform}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Impressions
                          </p>
                          <p className="text-2xl font-bold">
                            {result.impressions || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Engagement Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {parseFloat(
                              (result.engagementRate as any) || "0"
                            ).toFixed(2)}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Engagements
                          </p>
                          <p className="text-2xl font-bold">
                            {result.engagements || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Clicks
                          </p>
                          <p className="text-2xl font-bold">
                            {result.clicks || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {testResults.summary && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-900">
                        Test Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-green-900">
                      <p>
                        <span className="font-medium">Status:</span>{" "}
                        {testResults.summary.status}
                      </p>
                      <p>
                        <span className="font-medium">Total Variations:</span>{" "}
                        {testResults.summary.totalVariations}
                      </p>
                      {testResults.summary.winningVariationIndex !== null && (
                        <p>
                          <span className="font-medium">Winner:</span> Variation{" "}
                          {testResults.summary.winningVariationIndex}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
