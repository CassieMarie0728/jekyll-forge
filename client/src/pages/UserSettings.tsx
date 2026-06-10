import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountCard } from "@/components/AccountCard";
import { SocialMediaConnectionFlow } from "@/components/SocialMediaConnectionFlow";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  User, Lock, Bell, Github, Twitter, Linkedin, Facebook, Instagram,
  Plus, LogOut, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function UserSettings() {
  const { user, isAuthenticated } = useAuth();
  const [showConnectionFlow, setShowConnectionFlow] = useState(false);

  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = trpc.socialMedia.getAccounts.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
    onError: () => {
      toast.error("Failed to logout");
    },
  });

  const handleConnectPlatform = () => {
    setShowConnectionFlow(true);
  };

  const connectedPlatforms = new Set(accounts?.map((a) => a.platform) || []);
  const availablePlatforms = ["twitter", "linkedin", "facebook", "instagram"].filter(
    (p) => !connectedPlatforms.has(p as any)
  ) as ("twitter" | "linkedin" | "facebook" | "instagram")[];

  const platformLabels = {
    twitter: { label: "X (Twitter)", icon: Twitter },
    linkedin: { label: "LinkedIn", icon: Linkedin },
    facebook: { label: "Facebook", icon: Facebook },
    instagram: { label: "Instagram", icon: Instagram },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and connected accounts</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Connected Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-lg font-semibold mt-1">{user?.name || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg font-semibold mt-1">{user?.email || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block font-mono">{user?.id}</code>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                    <p className="text-lg font-semibold mt-1">
                      {user?.createdAt
                        ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground">Account Role</label>
                  <div className="mt-2">
                    <Badge variant="outline" className="capitalize">
                      {user?.role || "user"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connected Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            {/* Connected Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Connected Social Media Accounts</CardTitle>
                <CardDescription>
                  Manage your connected accounts for content distribution and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                  </div>
                ) : accounts && accounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        onDisconnected={refetchAccounts}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">No connected accounts yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connect New Account */}
            {availablePlatforms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Connect New Account</CardTitle>
                  <CardDescription>Add more social media accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availablePlatforms.map((platform) => {
                      const config = platformLabels[platform];
                      const Icon = config.icon;
                      return (
                        <Button
                          key={platform}
                          variant="outline"
                          className="h-auto flex-col gap-2 p-4"
                          onClick={handleConnectPlatform}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs text-center">{config.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connection Flow Dialog */}
            <SocialMediaConnectionFlow
              open={showConnectionFlow}
              onOpenChange={setShowConnectionFlow}
              onConnected={() => {
                refetchAccounts();
              }}
            />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session & Security</CardTitle>
                <CardDescription>Manage your login sessions and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-4">
                    You are currently logged in to Jekyll Forge. Your session is secure and encrypted.
                  </p>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="w-4 h-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Security Tip:</strong> Always disconnect accounts you no longer use. Your access tokens are encrypted and stored securely.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
