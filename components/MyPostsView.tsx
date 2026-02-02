"use client";

import { FoodCard } from "@/components/FoodCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock, Archive } from "lucide-react";

type FoodPost = Parameters<typeof FoodCard>[0]["post"] & {
  isActive: boolean;
  expiresAt: number;
};

interface MyPostsViewProps {
  posts: FoodPost[];
  isLoading: boolean;
}

export function MyPostsView({ posts, isLoading }: MyPostsViewProps) {
  const now = Date.now();
  const activePosts = posts.filter((post) => post.isActive && post.expiresAt > now);
  const pastPosts = posts.filter((post) => !post.isActive || post.expiresAt <= now);

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-sm" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Posts</h1>
        <p className="text-sm text-muted-foreground">
          Track your active listings, edit details, and keep tabs on what&apos;s still available.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-sm border-2 border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-sm border border-border bg-primary/10 p-2 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Posts</p>
              <p className="text-xl font-semibold">{posts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-2 border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-sm border border-border bg-emerald-500/10 p-2 text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Now</p>
              <p className="text-xl font-semibold">{activePosts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-2 border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-sm border border-border bg-amber-500/10 p-2 text-amber-600">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Past Posts</p>
              <p className="text-xl font-semibold">{pastPosts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {posts.length === 0 ? (
        <Card className="rounded-sm border-2 border-dashed border-border bg-card">
          <CardContent className="space-y-2 p-6 text-center">
            <p className="font-display text-lg">No posts yet</p>
            <p className="text-sm text-muted-foreground">
              When you share food, your listings will appear here for quick edits and status checks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Active Posts</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {activePosts.length} active
              </span>
            </div>
            {activePosts.length === 0 ? (
              <Card className="rounded-sm border-2 border-dashed border-border">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  You don&apos;t have any active posts right now. Share a new listing to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activePosts.map((post, index) => (
                  <FoodCard key={post._id} post={post} index={index} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Past Posts</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {pastPosts.length} archived
              </span>
            </div>
            {pastPosts.length === 0 ? (
              <Card className="rounded-sm border-2 border-dashed border-border">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Older posts you&apos;ve marked as gone or that have expired will show up here.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pastPosts.map((post, index) => (
                  <FoodCard key={post._id} post={post} index={index} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
