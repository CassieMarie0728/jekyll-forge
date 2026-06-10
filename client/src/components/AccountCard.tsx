import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Github, Twitter, Linkedin, Facebook, Instagram, Trash2, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AccountCardProps {
  account: {
    id: number;
    platform: "twitter" | "linkedin" | "facebook" | "instagram" | "github";
    username?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
    isConnected: boolean | null;
    connectedAt?: Date;
    expiresAt?: Date | null;
  };
  onDisconnected?: () => void;
}

const PLATFORM_CONFIG = {
  twitter: {
    icon: Twitter,
    label: "X (Twitter)",
    color: "text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    url: (username: string) => `https://twitter.com/${username}`,
  },
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    url: (username: string) => `https://linkedin.com/in/${username}`,
  },
  facebook: {
    icon: Facebook,
    label: "Facebook",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    url: (username: string) => `https://facebook.com/${username}`,
  },
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950",
    url: (username: string) => `https://instagram.com/${username}`,
  },
  github: {
    icon: Github,
    label: "GitHub",
    color: "text-gray-900 dark:text-gray-100",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    url: (username: string) => `https://github.com/${username}`,
  },
};

export function AccountCard({ account, onDisconnected }: AccountCardProps) {
  const config = PLATFORM_CONFIG[account.platform];
  const Icon = config.icon;
  const disconnectMutation = trpc.socialMedia.disconnectAccount.useMutation({
    onSuccess: () => {
      toast.success(`Disconnected from ${config.label}`);
      onDisconnected?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect account");
    },
  });

  const handleDisconnect = () => {
    disconnectMutation.mutate({ id: account.id });
  };

  const profileUrl = account.username ? config.url(account.username) : null;

  return (
    <Card className={`${config.bgColor} border-0`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {account.profileImageUrl ? (
              <img
                src={account.profileImageUrl}
                alt={account.displayName || account.username || "Account"}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
              <CardDescription className="text-xs">
                {account.displayName || account.username || "Connected"}
              </CardDescription>
            </div>
          </div>
          <Badge variant={account.isConnected ? "default" : "secondary"}>
            {account.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Account Info */}
        <div className="space-y-2 text-sm">
          {account.username && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Username:</span>
              <code className="bg-background/50 px-2 py-1 rounded text-xs font-mono">
                {account.username}
              </code>
            </div>
          )}

          {account.displayName && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Display Name:</span>
              <span className="font-medium">{account.displayName}</span>
            </div>
          )}

          {account.connectedAt && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Connected
              </span>
              <span>{formatDistanceToNow(new Date(account.connectedAt), { addSuffix: true })}</span>
            </div>
          )}

          {account.expiresAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Token expires:</span>
              <span className="text-amber-600 dark:text-amber-400">
                {formatDistanceToNow(new Date(account.expiresAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {profileUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => window.open(profileUrl, "_blank")}
            >
              <ExternalLink className="w-3 h-3" />
              View Profile
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-2"
                disabled={disconnectMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect {config.label}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your {config.label} account connection. You can reconnect anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-3">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
