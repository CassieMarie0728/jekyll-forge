import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export default function SocialAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Social Media Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Track the performance of your repurposed content across all platforms
        </p>
      </div>

      {/* Main Analytics Dashboard */}
      <AnalyticsDashboard />

      {/* Tips Card */}\n      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tips for Better Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">Twitter/X Threads</h4>
            <p className="text-sm text-muted-foreground">
              Break down complex ideas into 5-7 tweets. Use hooks in the first tweet to capture attention.
            </p>
          </div>
          <div>
            <h4 className="font-medium">LinkedIn Articles</h4>
            <p className="text-sm text-muted-foreground">
              Share professional insights and industry trends. Articles perform best when published on weekdays.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Engagement Tips</h4>
            <p className="text-sm text-muted-foreground">
              Respond to comments quickly, ask questions, and encourage shares to boost engagement metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
