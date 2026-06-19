import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";

interface SocialPostPreviewProps {
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  content: string;
  scheduledAt?: Date;
  accountName?: string;
  accountImage?: string;
}

/**
 * Social Post Preview Component
 * Shows how the post will look on each platform before publishing
 */
export const SocialPostPreview: React.FC<SocialPostPreviewProps> = ({
  platform,
  content,
  scheduledAt,
  accountName = "Your Account",
  accountImage,
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (platform === "twitter") {
    return (
      <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          {/* Twitter Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {accountName}
              </div>
              <div className="text-sm text-slate-500">@username</div>
            </div>
          </div>

          {/* Tweet Content */}
          <p className="text-slate-900 dark:text-white mb-3 text-base leading-normal break-words">
            {content}
          </p>

          {/* Scheduled Badge */}
          {scheduledAt && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                Scheduled for {formatDate(scheduledAt)}
              </Badge>
            </div>
          )}

          {/* Twitter Engagement Buttons */}
          <div className="flex justify-between text-slate-500 text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 hover:text-blue-400 cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-2 hover:text-green-400 cursor-pointer">
              <Repeat2 className="w-4 h-4" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-2 hover:text-red-400 cursor-pointer">
              <Heart className="w-4 h-4" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-2 hover:text-blue-400 cursor-pointer">
              <Share className="w-4 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (platform === "linkedin") {
    return (
      <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          {/* LinkedIn Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {accountName}
              </div>
              <div className="text-xs text-slate-500">Connected • Now</div>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-slate-900 dark:text-white mb-3 text-sm leading-normal break-words">
            {content}
          </p>

          {/* Scheduled Badge */}
          {scheduledAt && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                Scheduled for {formatDate(scheduledAt)}
              </Badge>
            </div>
          )}

          {/* LinkedIn Engagement Buttons */}
          <div className="flex justify-between text-slate-500 text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Heart className="w-4 h-4" />
              <span>Like</span>
            </div>
            <div className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Repeat2 className="w-4 h-4" />
              <span>Share</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (platform === "facebook") {
    return (
      <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          {/* Facebook Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {accountName}
              </div>
              <div className="text-xs text-slate-500">Now</div>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-slate-900 dark:text-white mb-3 text-sm leading-normal break-words">
            {content}
          </p>

          {/* Scheduled Badge */}
          {scheduledAt && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                Scheduled for {formatDate(scheduledAt)}
              </Badge>
            </div>
          )}

          {/* Facebook Engagement Buttons */}
          <div className="flex justify-around text-slate-500 text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Heart className="w-4 h-4" />
              <span>Like</span>
            </div>
            <div className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Share className="w-4 h-4" />
              <span>Share</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (platform === "instagram") {
    return (
      <Card className="w-full max-w-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {/* Instagram Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {accountName}
                </div>
              </div>
            </div>
            <div className="text-slate-500 cursor-pointer">•••</div>
          </div>

          {/* Image Placeholder */}
          <div className="w-full aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <span className="text-slate-500 text-sm">Image</span>
          </div>

          {/* Instagram Actions */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-3 mb-3">
              <Heart className="w-5 h-5 cursor-pointer hover:text-red-500" />
              <MessageCircle className="w-5 h-5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-400" />
              <Share className="w-5 h-5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              0 likes
            </div>
          </div>

          {/* Caption */}
          <div className="p-3">
            <p className="text-sm text-slate-900 dark:text-white break-words mb-2">
              <span className="font-bold">{accountName}</span> {content}
            </p>

            {/* Scheduled Badge */}
            {scheduledAt && (
              <Badge variant="outline" className="text-xs">
                Scheduled for {formatDate(scheduledAt)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default SocialPostPreview;
