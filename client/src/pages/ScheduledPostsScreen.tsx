import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ContentCalendar } from "@/components/ContentCalendar";
import { toast } from "sonner";
import {
  Calendar, Clock, AlertCircle, CheckCircle, XCircle, Edit2, Trash2, Eye,
} from "lucide-react";
import { format } from "date-fns";

interface ScheduledPost {
  id: number;
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  content: string;
  scheduledAt: Date;
  status: "pending" | "published" | "failed" | "cancelled";
  externalUrl?: string;
  repurposedContentId: number;
  errorMessage?: string;
  retryCount?: number;
}

export const ScheduledPostsScreen: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState("");

  // Mock data - in real implementation, fetch from tRPC
  const [scheduledPosts] = useState<ScheduledPost[]>([
    {
      id: 1,
      platform: "twitter",
      content: "Just published a new blog post on React hooks!",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "pending",
      repurposedContentId: 1,
    },
    {
      id: 2,
      platform: "linkedin",
      content: "Excited to share insights on modern web development practices",
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pending",
      repurposedContentId: 2,
    },
    {
      id: 3,
      platform: "facebook",
      content: "Check out our latest article on productivity tips",
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "published",
      externalUrl: "https://facebook.com/posts/123456",
      repurposedContentId: 3,
    },
  ]);

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-100 dark:bg-yellow-900", textColor: "text-yellow-800 dark:text-yellow-200" },
    published: { icon: CheckCircle, color: "bg-green-100 dark:bg-green-900", textColor: "text-green-800 dark:text-green-200" },
    failed: { icon: XCircle, color: "bg-red-100 dark:bg-red-900", textColor: "text-red-800 dark:text-red-200" },
    cancelled: { icon: AlertCircle, color: "bg-gray-100 dark:bg-gray-900", textColor: "text-gray-800 dark:text-gray-200" },
  };

  const handleReschedule = async () => {
    if (!selectedPost || !newScheduleDate) {
      toast.error("Please select a new date and time");
      return;
    }

    try {
      // TODO: Call tRPC reschedule mutation
      toast.success(`Post rescheduled for ${format(new Date(newScheduleDate), "MMM d, yyyy HH:mm")}`);
      setShowReschedule(false);
      setNewScheduleDate("");
    } catch (error) {
      toast.error("Failed to reschedule post");
    }
  };

  const handleCancel = async () => {
    if (!selectedPost) return;

    try {
      // TODO: Call tRPC cancel mutation
      toast.success("Post cancelled successfully");
      setShowDetails(false);
    } catch (error) {
      toast.error("Failed to cancel post");
    }
  };

  const pendingPosts = scheduledPosts.filter((p) => p.status === "pending");
  const publishedPosts = scheduledPosts.filter((p) => p.status === "published");
  const failedPosts = scheduledPosts.filter((p) => p.status === "failed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Posts</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your scheduled social media posts and track their performance
        </p>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingPosts.length > 0 && (
              <Badge className="ml-2 bg-yellow-600">{pendingPosts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="published">
            Published
            {publishedPosts.length > 0 && (
              <Badge className="ml-2 bg-green-600">{publishedPosts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            {failedPosts.length > 0 && (
              <Badge className="ml-2 bg-red-600">{failedPosts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
              <CardDescription>
                Visual overview of all your scheduled posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentCalendar
                posts={scheduledPosts}
                onPostClick={(post) => {
                  setSelectedPost(post as any);
                  setShowDetails(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Posts */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-600 dark:text-slate-400">No pending posts</p>
              </CardContent>
            </Card>
          ) : (
            pendingPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="capitalize">{post.platform}</Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(post.scheduledAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          setShowReschedule(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Published Posts */}
        <TabsContent value="published" className="mt-4 space-y-4">
          {publishedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-600 dark:text-slate-400">No published posts</p>
              </CardContent>
            </Card>
          ) : (
            publishedPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="capitalize">{post.platform}</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          Published
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {format(new Date(post.scheduledAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (post.externalUrl) {
                          window.open(post.externalUrl, "_blank");
                        }
                      }}
                      disabled={!post.externalUrl}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Failed Posts */}
        <TabsContent value="failed" className="mt-4 space-y-4">
          {failedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-600 dark:text-slate-400">No failed posts</p>
              </CardContent>
            </Card>
          ) : (
            failedPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="capitalize">{post.platform}</Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-800">
                          Failed
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      {post.errorMessage && (
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                          Error: {post.errorMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(post.scheduledAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPost(post);
                        setShowReschedule(true);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Post Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Platform
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize mt-1">
                  {selectedPost.platform}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Content
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">
                  {selectedPost.content}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <Badge className="mt-1 capitalize">{selectedPost.status}</Badge>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Scheduled For
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {format(new Date(selectedPost.scheduledAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>

              {selectedPost.externalUrl && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    External Link
                  </label>
                  <a
                    href={selectedPost.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                  >
                    View on {selectedPost.platform}
                  </a>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                New Date & Time
              </label>
              <input
                type="datetime-local"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReschedule(false);
                setNewScheduleDate("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReschedule}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledPostsScreen;
