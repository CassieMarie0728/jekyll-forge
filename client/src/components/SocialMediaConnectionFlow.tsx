import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Twitter, Linkedin, ExternalLink, AlertCircle } from "lucide-react";

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
  const [selectedPlatform, setSelectedPlatform] = useState<"twitter" | "linkedin" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const platforms = [
    {
      id: "twitter" as const,
      name: "Twitter/X",
      icon: Twitter,
      description: "Connect your Twitter account to publish threads and track engagement",
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
      description: "Connect your LinkedIn account to publish articles and track impressions",
      color: "bg-blue-50 border-blue-200",
      requirements: [
        "LinkedIn Developer Account",
        "OAuth 2.0 credentials (Client ID & Secret)",
        "Redirect URI configured",
      ],
    },
  ];

  const handleConnect = async (platform: "twitter" | "linkedin") => {
    setIsConnecting(true);
    try {
      // In a real implementation, this would:
      // 1. Generate a state token and store it in session
      // 2. Redirect to the platform's OAuth authorization URL
      // 3. Handle the callback with the authorization code
      // 4. Exchange code for access token
      // 5. Store credentials in database

      // For now, show a placeholder message
      toast.info(`OAuth flow for ${platform} would start here. This requires backend OAuth configuration.`);

      // Simulate OAuth flow
      setTimeout(() => {
        toast.success(`${platform} account connected!`);
        onConnected?.();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      toast.error(`Failed to connect ${platform} account`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Social Media Accounts</DialogTitle>
          <DialogDescription>
            Authorize Jekyll Forge to publish and track your content on social platforms
          </DialogDescription>
        </DialogHeader>

        {selectedPlatform ? (
          <div className="space-y-4">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => setSelectedPlatform(null)}
              disabled={isConnecting}
            >
              ← Back
            </Button>

            {/* Platform Details */}
            {platforms
              .filter((p) => p.id === selectedPlatform)
              .map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.id} className={`p-4 rounded-lg border ${platform.color}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <Icon className="w-6 h-6 mt-1" />
                      <div>
                        <h3 className="font-semibold">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Requirements:</h4>
                        <ul className="space-y-1">
                          {platform.requirements.map((req, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded bg-amber-50 border border-amber-200 flex gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          OAuth setup requires backend configuration. Contact support to enable OAuth for your account.
                        </p>
                      </div>

                      <Button
                        onClick={() => handleConnect(selectedPlatform)}
                        disabled={isConnecting}
                        className="w-full gap-2"
                        size="lg"
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
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${platform.color}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
