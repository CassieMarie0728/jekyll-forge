import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScheduledPost {
  id: number;
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  content: string;
  scheduledAt: Date;
  status: "pending" | "published" | "failed" | "cancelled";
  externalUrl?: string;
}

interface ContentCalendarProps {
  posts: ScheduledPost[];
  onPostClick?: (post: ScheduledPost) => void;
  onReschedule?: (postId: number) => void;
  onCancel?: (postId: number) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  linkedin: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  facebook:
    "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200",
  instagram: "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  published:
    "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  failed: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  cancelled: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
};

export const ContentCalendar: React.FC<ContentCalendarProps> = ({
  posts,
  onPostClick,
  onReschedule,
  onCancel,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  const getPostsForDay = (day: number) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === currentDate.getMonth() &&
        postDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Content Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[150px] text-center">
              {monthName}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayPosts = day ? getPostsForDay(day) : [];
            const isToday =
              day &&
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            const bgClass = day
              ? isToday
                ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700";

            return (
              <div
                key={index}
                className={`min-h-24 p-2 border rounded-lg ${bgClass}`}
              >
                {day && (
                  <>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map(post => (
                        <div
                          key={post.id}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onPostClick?.(post)}
                        >
                          <div
                            className={`px-2 py-1 rounded text-xs font-semibold ${PLATFORM_COLORS[post.platform]}`}
                          >
                            {post.platform}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                            {post.content}
                          </div>
                          <div
                            className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold w-fit ${STATUS_COLORS[post.status]}`}
                          >
                            {post.status}
                          </div>
                        </div>
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-xs text-slate-500 px-1">
                          +{dayPosts.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Legend
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-800" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800" />
              <span>Published</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-800" />
              <span>Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800" />
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCalendar;
