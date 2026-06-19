import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, TrendingUp, Eye, MessageCircle, Link2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function AnalyticsDashboard() {
  const summaryQuery = trpc.socialMedia.getAnalyticsSummary.useQuery();
  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No analytics data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: "Total Impressions",
      value: summary.totalImpressions.toLocaleString(),
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Engagements",
      value: summary.totalEngagements.toLocaleString(),
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Total Clicks",
      value: summary.totalClicks.toLocaleString(),
      icon: Link2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const engagementRate =
    summary.totalImpressions > 0
      ? ((summary.totalEngagements / summary.totalImpressions) * 100).toFixed(2)
      : "0";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="text-3xl font-bold mt-2">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engagement Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-4xl font-bold text-blue-600">
                {engagementRate}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.totalEngagements} engagements from{" "}
                {summary.totalImpressions.toLocaleString()} impressions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      {Object.keys(summary.byPlatform).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance by Platform
            </CardTitle>
            <CardDescription>How each platform is performing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.byPlatform).map(([platform, stats]) => (
                <div key={platform} className="p-4 rounded-lg border bg-card">
                  <p className="font-semibold capitalize mb-3">{platform}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Impressions</p>
                      <p className="font-semibold text-lg">
                        {stats.impressions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagements</p>
                      <p className="font-semibold text-lg">
                        {stats.engagements.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-semibold text-lg">
                        {stats.clicks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
