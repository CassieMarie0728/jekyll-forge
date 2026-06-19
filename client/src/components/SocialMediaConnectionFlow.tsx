import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface SocialMediaConnectionFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export function SocialMediaConnectionFlow({
  open,
  onOpenChange,
  onConnected,
}: SocialMediaConnectionFlowProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<
    "twitter" | "linkedin" | "facebook" | "instagram" | null
  >(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const platforms = [
    {
      id: "twitter" as const,
      name: "Twitter/X",
      icon: Twitter,
      description:
        "Connect your Twitter account to publish threads and track engagement",
      color: "bg-blue-50 border-blue-200",
      requirements: [
        "Twitter Developer Account",
        "OAuth 2.0 credentials (Client ID & Secret)",
        "Redirect URI configured",
      ],
    },
    {
      id: "linkedin" as const,
      name: "LinkedIn",
      icon: Linkedin,
      description:
        "Connect your LinkedIn account to publish articles and track impressions",
      color: "bg-blue-50 border-blue-200",
      requirements: [
        "LinkedIn Developer Account",
        "OAuth 2.0 credentials (Client ID & Secret)",
        "Redirect URI configured",
      ],
    },
    {
      id: "facebook" as const,
      name: "Facebook",
      icon: Facebook,
      description:
        "Connect your Facebook page to publish posts and track engagement",
      color: "bg-blue-50 border-blue-200",
      requirements: [
        "Facebook Business Account",
        "Facebook App with Pages permission",
        "Page Access Token",
      ],
    },
    {
      id: "instagram" as const,
      name: "Instagram",
      icon: Instagram,
      description:
        "Connect your Instagram business account to share content and track metrics",
      color: "bg-purple-50 border-purple-200",
      requirements: [
        "Instagram Business Account",
        "Facebook App with Instagram Graph API",
        "User Access Token",
      ],
    },
  ];

  const handleConnect = async (
    platform: "twitter" | "linkedin" | "facebook" | "instagram"
  ) => {
    setIsConnecting(true);
    try {
      // Generate state token for CSRF protection
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem(`oauth_state_${platform}`, state);

      // Get OAuth authorization URL from backend
      const response = await fetch("/api/trpc/socialMedia.getOAuthUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, state }),
      });

      if (!response.ok) {
        throw new Error("Failed to get OAuth URL");
      }

      const data = (await response.json()) as any;
      const authUrl = data.result?.data?.url;

      if (!authUrl) {
        throw new Error("No authorization URL returned");
      }

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      toast.error(
        `Failed to connect ${platform} account: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Social Media Account</DialogTitle>
          <DialogDescription>
            Select a platform to connect your account and start publishing
            content
          </DialogDescription>
        </DialogHeader>

        {selectedPlatform ? (
          <div className="space-y-4">
            {/* Selected Platform Details */}
            {platforms
              .filter(p => p.id === selectedPlatform)
              .map(platform => {
                const Icon = platform.icon;
                return (
                  <Card key={platform.id} className={platform.color}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {platform.name}
                      </CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Requirements:</h4>
                        <ul className="space-y-1">
                          {platform.requirements.map((req, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-current rounded-full" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          You will be redirected to {platform.name} to authorize
                          access. Make sure you have your developer credentials
                          ready.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPlatform(null)}
                          disabled={isConnecting}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => handleConnect(selectedPlatform)}
                          disabled={isConnecting}
                          className="flex-1 gap-2"
                        >
                          {isConnecting ? (
                            <>
                              <Spinner className="w-4 h-4" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" />
                              Connect {platform.name}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {platforms.map(platform => {
              const Icon = platform.icon;
              return (
                <Card
                  key={platform.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${platform.color}`}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <Icon className="w-8 h-8" />
                      <h3 className="font-medium">{platform.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {platform.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
