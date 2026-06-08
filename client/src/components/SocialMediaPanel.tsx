import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Twitter, Linkedin, Trash2, Share2, BarChart3, Loader } from "lucide-react";

interface SocialMediaPanelProps {
  repurposedContentId: number;
  format: string;
}

export function SocialMediaPanel({ repurposedContentId, format }: SocialMediaPanelProps) {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [publishingTo, setPublishingTo] = useState<number | null>(null);

  const accountsQuery = trpc.socialMedia.getAccounts.useQuery();
  const analyticsQuery = trpc.socialMedia.getContentAnalytics.useQuery({ repurposedContentId });
  const publishMutation = trpc.socialMedia.publishContent.useMutation();
  const syncMutation = trpc.socialMedia.syncAnalytics.useMutation();
  const disconnectMutation = trpc.socialMedia.disconnectAccount.useMutation();

  const accounts = accountsQuery.data || [];
  const analytics = analyticsQuery.data || [];

  // Filter accounts by format compatibility
  const compatibleAccounts = accounts.filter((account) => {
    if (format === "twitter") return account.platform === "twitter";
    if (format === "linkedin") return account.platform === "linkedin";
    return false;
  });

  const handlePublish = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account");
      return;
    }

    setPublishingTo(selectedAccountId);
    try {
      await publishMutation.mutateAsync({
        repurposedContentId,
        accountId: selectedAccountId,
      });
      toast.success("Published successfully!");
      setShowPublishDialog(false);
      analyticsQuery.refetch();
    } catch (error) {
      toast.error("Failed to publish");
    } finally {
      setPublishingTo(null);
    }
  };

  const handleSyncAnalytics = async (analyticsId: number) => {
    try {
      await syncMutation.mutateAsync({ analyticsId });
      toast.success("Analytics updated!");
      analyticsQuery.refetch();
    } catch (error) {
      toast.error("Failed to sync analytics");
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    try {
      await disconnectMutation.mutateAsync({ id: accountId });
      toast.success("Account disconnected");
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Failed to disconnect account");
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === "twitter") return <Twitter className="w-4 h-4" />;
    if (platform === "linkedin") return <Linkedin className="w-4 h-4" />;
    return null;
  };

  const getPlatformColor = (platform: string) => {
    if (platform === "twitter") return "bg-blue-50 border-blue-200";
    if (platform === "linkedin") return "bg-blue-50 border-blue-200";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-4">
      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>Manage your social media integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts connected yet</p>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getPlatformColor(account.platform)}`}
              >
                <div className="flex items-center gap-3">
                  {getPlatformIcon(account.platform)}
                  <div>
                    <p className="font-medium text-sm">{account.displayName || account.username}</p>
                    <p className="text-xs text-muted-foreground">@{account.username}</p>
                  </div>
                  {account.isConnected && <Badge variant="outline" className="text-xs">Connected</Badge>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(account.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Publish Button */}
      {compatibleAccounts.length > 0 && (
        <Button
          onClick={() => setShowPublishDialog(true)}
          className="w-full gap-2"
          size="lg"
        >
          <Share2 className="w-4 h-4" />
          Publish to {format === "twitter" ? "Twitter" : "LinkedIn"}
        </Button>
      )}

      {/* Analytics */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.map((metric) => (
              <div key={metric.id} className="space-y-2 p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(metric.platform)}
                    <a
                      href={metric.externalUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View Post
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncAnalytics(metric.id)}
                    disabled={syncMutation.isPending}
                    className="gap-2"
                  >
                    {syncMutation.isPending ? (
                      <Spinner className="w-3 h-3" />
                    ) : (
                      <BarChart3 className="w-3 h-3" />
                    )}
                    Sync
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Impressions</p>
                    <p className="font-semibold text-lg">{(metric.impressions || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Engagements</p>
                    <p className="font-semibold text-lg">{(metric.engagements || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Clicks</p>
                    <p className="font-semibold text-lg">{(metric.clicks || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Shares</p>
                    <p className="font-semibold text-lg">{(metric.shares || 0).toLocaleString()}</p>
                  </div>
                </div>

                {metric.lastSyncedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(metric.lastSyncedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish to {format === "twitter" ? "Twitter" : "LinkedIn"}</DialogTitle>
            <DialogDescription>
              Select which account to publish this content to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {compatibleAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedAccountId === account.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-border hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getPlatformIcon(account.platform)}
                  <div>
                    <p className="font-medium">{account.displayName || account.username}</p>
                    <p className="text-sm text-muted-foreground">@{account.username}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!selectedAccountId || publishingTo !== null}
              className="gap-2"
            >
              {publishingTo !== null ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
