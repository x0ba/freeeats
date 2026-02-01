"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Trash2, Flag, Pizza, Coffee, Cookie, Sandwich, Salad, UtensilsCrossed, Star, Loader2, MessageSquare, ImagePlus, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";

type DietaryTag = "vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free";

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
  dietaryTags?: DietaryTag[];
  averageRating?: number;
  reviewCount?: number;
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

const dietaryTagConfig: Record<DietaryTag, { icon: string; label: string }> = {
  vegetarian: { icon: "🥬", label: "Vegetarian" },
  vegan: { icon: "🌱", label: "Vegan" },
  halal: { icon: "☪️", label: "Halal" },
  kosher: { icon: "✡️", label: "Kosher" },
  "gluten-free": { icon: "🌾", label: "Gluten-Free" },
  "dairy-free": { icon: "🥛", label: "Dairy-Free" },
  "nut-free": { icon: "🥜", label: "Nut-Free" },
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
  const [isMarkingGone, setIsMarkingGone] = useState(false);
  
  // Review dialog state - must be declared before useQuery that depends on it
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Review image upload state
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [existingReviewImageId, setExistingReviewImageId] = useState<Id<"_storage"> | null>(null);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const markGone = useMutation(api.food.markGone);
  const reportGone = useMutation(api.food.reportGone);
  const addReview = useMutation(api.reviews.addReview);
  const generateReviewUploadUrl = useMutation(api.reviews.generateUploadUrl);
  
  // Queries
  const currentUser = useQuery(api.users.getCurrent);
  const userReview = useQuery(api.reviews.getUserReview, { foodPostId: post._id });
  // Fetch all reviews when dialog is open
  const allReviews = useQuery(
    api.reviews.getForFoodPost,
    reviewDialogOpen ? { foodPostId: post._id } : "skip"
  );
  
  // Check if the current user is the creator
  const isCreator = currentUser?._id === post.createdBy;
  
  // Check if the current user has already reported this post
  const hasReported = currentUser ? post.reportedBy.includes(currentUser._id) : false;
  
  // Initialize review form when user's existing review loads
  useEffect(() => {
    if (userReview) {
      setReviewRating(userReview.rating);
      setReviewComment(userReview.comment ?? "");
      setExistingReviewImageId(userReview.imageId ?? null);
    }
  }, [userReview]);

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
      const result = await reportGone({ postId: post._id });
      if (result.action === "unreported") {
        toast.success("Report withdrawn");
      } else {
        toast.success("Thanks for reporting! The poster has been notified.");
      }
    } catch (error) {
      console.error("Failed to report:", error);
      toast.error("Failed to report");
    } finally {
      setIsMarkingGone(false);
    }
  };

  const handleOpenReviewDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow anyone to open dialog to view reviews
    // The form for adding reviews is only shown to non-creators who are logged in
    setReviewDialogOpen(true);
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setReviewImageFile(file);
      setReviewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveReviewImage = () => {
    setReviewImageFile(null);
    setReviewImagePreview(null);
    setExistingReviewImageId(null);
    if (reviewImageInputRef.current) {
      reviewImageInputRef.current.value = "";
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      let imageId: Id<"_storage"> | undefined = existingReviewImageId ?? undefined;
      
      // Upload new image if selected
      if (reviewImageFile) {
        const uploadUrl = await generateReviewUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": reviewImageFile.type },
          body: reviewImageFile,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }
      
      await addReview({
        foodPostId: post._id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        imageId,
      });
      toast.success(userReview ? "Review updated!" : "Review submitted!");
      
      // Reset image state
      setReviewImageFile(null);
      setReviewImagePreview(null);
      setReviewDialogOpen(false);
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-outfit text-lg font-semibold tracking-tight line-clamp-1">
            {post.title}
          </h3>
          {/* Rating Display - clickable for everyone to view reviews */}
          <button
            onClick={handleOpenReviewDialog}
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs transition-colors hover:bg-amber-500/20"
          >
            <Star className={`h-3 w-3 ${(post.averageRating ?? 0) > 0 ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
            <span className="font-medium text-amber-600">
              {(post.averageRating ?? 0) > 0 
                ? post.averageRating?.toFixed(1) 
                : isCreator ? "Reviews" : "Rate"}
            </span>
            {(post.reviewCount ?? 0) > 0 && (
              <span className="text-muted-foreground">({post.reviewCount})</span>
            )}
          </button>
        </div>
        {post.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        )}
        {post.dietaryTags && post.dietaryTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full bg-coral-500/10 px-2 py-0.5 text-xs text-coral-600"
                title={dietaryTagConfig[tag].label}
              >
                <span>{dietaryTagConfig[tag].icon}</span>
                <span className="hidden sm:inline">{dietaryTagConfig[tag].label}</span>
              </span>
            ))}
          </div>
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
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReportGone}
            disabled={isMarkingGone || isExpired || !currentUser}
            className={`h-8 gap-1.5 text-xs ${
              hasReported
                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
                : "text-muted-foreground hover:text-amber-600"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${hasReported ? "fill-amber-500" : ""}`} />
            {hasReported ? "Reported" : "Report Gone"}
            {post.goneReports > 0 && (
              <span className={`ml-1 rounded-full px-1.5 text-[10px] ${
                hasReported ? "bg-amber-500/20 text-amber-600" : "bg-amber-500/20 text-amber-600"
              }`}>
                {post.goneReports}
              </span>
            )}
          </Button>
        )}
      </CardFooter>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-coral-500" />
              {isCreator ? "Reviews" : userReview ? "Edit Your Review" : "Rate This Food"}
            </DialogTitle>
            <DialogDescription>
              {post.title}
              {(post.reviewCount ?? 0) > 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {post.averageRating?.toFixed(1)} ({post.reviewCount} {post.reviewCount === 1 ? "review" : "reviews"})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Rating form - only for logged-in non-creators */}
            {!isCreator && currentUser && (
              <>
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-2 pb-4 border-b">
                  <span className="text-sm font-medium">How was it?</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoverRating || reviewRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {reviewRating === 1 && "Poor"}
                    {reviewRating === 2 && "Fair"}
                    {reviewRating === 3 && "Good"}
                    {reviewRating === 4 && "Very Good"}
                    {reviewRating === 5 && "Excellent!"}
                  </span>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor="review-comment">Comment (optional)</Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Share your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Photo (optional)</Label>
                  {(() => {
                    // Compute the image URL to display
                    const existingImageUrl = allReviews?.find(r => r.userId === currentUser?._id)?.imageUrl;
                    const displayImageUrl = reviewImagePreview || existingImageUrl;
                    
                    if (displayImageUrl || existingReviewImageId) {
                      return (
                        <div className="relative inline-block">
                          {displayImageUrl && (
                            <img
                              src={displayImageUrl}
                              alt="Review"
                              className="h-24 w-24 rounded-lg object-cover"
                            />
                          )}
                          {!displayImageUrl && existingReviewImageId && (
                            <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleRemoveReviewImage}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-md hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <Input
                          ref={reviewImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleReviewImageChange}
                          className="hidden"
                          id="review-image-input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => reviewImageInputRef.current?.click()}
                          className="gap-2"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Add Photo
                        </Button>
                      </div>
                    );
                  })()}
                </div>

                {/* Submit Button */}
                <div className="pt-2 border-t">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || isSubmittingReview}
                    className="w-full gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4" />
                        {userReview ? "Update Review" : "Submit Review"}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Sign in prompt for non-logged-in users */}
            {!currentUser && !isCreator && (
              <div className="text-center py-4 border-b">
                <p className="text-sm text-muted-foreground">
                  Sign in to leave a review
                </p>
              </div>
            )}

            {/* All Reviews List */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                All Reviews
              </h4>
              {allReviews && allReviews.length > 0 ? (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {allReviews.map((review) => (
                    <div
                      key={review._id}
                      className="rounded-lg border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={review.user.imageUrl ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {review.user.name?.[0]?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{review.user.name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                      {review.imageUrl && (
                        <img
                          src={review.imageUrl}
                          alt="Review photo"
                          className="mt-2 h-32 w-auto rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(review.imageUrl as string, "_blank")}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No reviews yet. Be the first to review!
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
