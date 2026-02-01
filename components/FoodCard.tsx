"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Trash2, Flag, Undo2, Pizza, Coffee, Cookie, Sandwich, Salad, UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";

interface FoodPostData {
  _id: Id<"foodPosts">;
  title: string;
  description?: string;
  foodType: FoodType;
  locationName: string;
  imageUrl: string | null;
  expiresAt: number;
  timeRemaining: number;
  creator: { name: string; imageUrl?: string } | null;
  createdBy: Id<"users">;
  _creationTime: number;
  goneReports: number;
  reportedBy: Id<"users">[];
}

interface FoodCardProps {
  post: FoodPostData;
  onClick?: () => void;
}

const foodTypeConfig: Record<FoodType, { icon: typeof Pizza; color: string; label: string }> = {
  pizza: { icon: Pizza, color: "bg-orange-500/10 text-orange-600", label: "Pizza" },
  sandwiches: { icon: Sandwich, color: "bg-amber-500/10 text-amber-600", label: "Sandwiches" },
  snacks: { icon: Cookie, color: "bg-yellow-500/10 text-yellow-600", label: "Snacks" },
  drinks: { icon: Coffee, color: "bg-blue-500/10 text-blue-600", label: "Drinks" },
  desserts: { icon: Cookie, color: "bg-pink-500/10 text-pink-600", label: "Desserts" },
  asian: { icon: UtensilsCrossed, color: "bg-red-500/10 text-red-600", label: "Asian" },
  mexican: { icon: Salad, color: "bg-green-500/10 text-green-600", label: "Mexican" },
  other: { icon: UtensilsCrossed, color: "bg-gray-500/10 text-gray-600", label: "Other" },
};

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMins}m left`;
  return `${Math.floor(hours / 24)}d left`;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FoodCard({ post, onClick }: FoodCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(post.timeRemaining);
  const markGone = useMutation(api.food.markGone);
  const reportGone = useMutation(api.food.reportGone);
  const unreportGone = useMutation(api.food.unreportGone);
  const currentUser = useQuery(api.users.getCurrent);
  const [isMarkingGone, setIsMarkingGone] = useState(false);
  
  // Check if the current user is the creator
  const isCreator = currentUser?._id === post.createdBy;
  
  // Check if the current user has already reported this post
  const hasReported = currentUser ? post.reportedBy.includes(currentUser._id) : false;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const config = foodTypeConfig[post.foodType];
  const FoodIcon = config.icon;
  const isExpired = timeRemaining <= 0;

  const handleMarkGone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMarkingGone(true);
    try {
      await markGone({ postId: post._id });
      toast.success("Food post deleted");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete food post");
    } finally {
      setIsMarkingGone(false);
    }
  };

  const handleReportGone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMarkingGone(true);
    try {
      await reportGone({ postId: post._id });
      toast.success("Thanks for reporting! The poster has been notified.");
    } catch (error) {
      console.error("Failed to report:", error);
      toast.error("Failed to report");
    } finally {
      setIsMarkingGone(false);
    }
  };

  const handleUndoReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMarkingGone(true);
    try {
      await unreportGone({ postId: post._id });
      toast.success("Report withdrawn");
    } catch (error) {
      console.error("Failed to undo report:", error);
      toast.error("Failed to undo report");
    } finally {
      setIsMarkingGone(false);
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-coral-500/5 ${isExpired ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FoodIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Time Badge */}
        <div className="absolute right-2 top-2">
          <Badge
            variant="secondary"
            className={`gap-1 font-medium ${
              isExpired
                ? "bg-red-500/90 text-white"
                : timeRemaining < 1800000
                  ? "bg-amber-500/90 text-white"
                  : "bg-green-500/90 text-white"
            }`}
          >
            <Clock className="h-3 w-3" />
            {formatTimeRemaining(timeRemaining)}
          </Badge>
        </div>

        {/* Food Type Badge */}
        <div className="absolute left-2 top-2">
          <Badge className={`${config.color} gap-1`}>
            <FoodIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-outfit text-lg font-semibold tracking-tight line-clamp-1">
          {post.title}
        </h3>
        {post.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-coral-500" />
          <span className="line-clamp-1">{post.locationName}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.creator?.imageUrl} />
            <AvatarFallback className="text-xs">
              {post.creator?.name?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(post._creationTime)}
          </span>
        </div>
        {isCreator ? (
          <div className="flex items-center gap-2">
            {post.goneReports > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[10px] text-amber-600">
                <Flag className="h-3 w-3" />
                <span>{post.goneReports} {post.goneReports === 1 ? "report" : "reports"}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkGone}
              disabled={isMarkingGone || isExpired}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ) : hasReported ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[10px] text-amber-600">
              <Flag className="h-3 w-3" />
              <span>Reported</span>
              {post.goneReports > 0 && (
                <span className="font-medium">({post.goneReports})</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndoReport}
              disabled={isMarkingGone || isExpired}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReportGone}
            disabled={isMarkingGone || isExpired || !currentUser}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-amber-600"
          >
            <Flag className="h-3.5 w-3.5" />
            Report Gone
            {post.goneReports > 0 && (
              <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-600">
                {post.goneReports}
              </span>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
