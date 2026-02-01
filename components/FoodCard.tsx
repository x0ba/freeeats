"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Heart, MapPin, Trash2, Flag, Pizza, Coffee, Cookie, Sandwich, Salad, UtensilsCrossed, Star, Loader2, MessageSquare, ImagePlus, X, Pencil, Plus, Search, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  latitude: number;
  longitude: number;
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

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Debounce hook for address search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface FoodCardProps {
  post: FoodPostData;
  onClick?: () => void;
  isFavorite?: boolean;
  matchesDiet?: boolean;
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

export function FoodCard({ post, onClick, isFavorite = false, matchesDiet = false }: FoodCardProps) {
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

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editDescription, setEditDescription] = useState(post.description ?? "");
  const [editFoodType, setEditFoodType] = useState<FoodType>(post.foodType);
  const [editLocation, setEditLocation] = useState(post.locationName);
  const [editDietaryTags, setEditDietaryTags] = useState<DietaryTag[]>(post.dietaryTags ?? []);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Address search state for edit
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const debouncedAddressQuery = useDebounce(addressQuery, 400);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const markGone = useMutation(api.food.markGone);
  const reportGone = useMutation(api.food.reportGone);
  const addReview = useMutation(api.reviews.addReview);
  const generateReviewUploadUrl = useMutation(api.reviews.generateUploadUrl);
  const updatePost = useMutation(api.food.update);
  const generateUploadUrl = useMutation(api.food.generateUploadUrl);
  
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

  // Address search effect
  useEffect(() => {
    const searchAddress = async () => {
      if (!debouncedAddressQuery.trim() || debouncedAddressQuery.length < 3) {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        return;
      }
      
      setIsSearchingAddress(true);
      try {
        // Search near the current post location for more relevant results
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(debouncedAddressQuery)}` +
          `&viewbox=${post.longitude - 0.1},${post.latitude + 0.1},${post.longitude + 0.1},${post.latitude - 0.1}` +
          `&bounded=0&limit=5`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        const data: AddressSuggestion[] = await response.json();
        setAddressSuggestions(data);
        setShowAddressSuggestions(data.length > 0);
      } catch (error) {
        console.error("Geocoding error:", error);
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    };
    
    searchAddress();
  }, [debouncedAddressQuery, post.latitude, post.longitude]);

  // Handle selecting an address suggestion
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setSelectedCoords({ lat, lng });
    setAddressQuery(suggestion.display_name);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

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

  // Edit handlers
  const handleOpenEditDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Reset form to current values
    setEditTitle(post.title);
    setEditDescription(post.description ?? "");
    setEditFoodType(post.foodType);
    setEditLocation(post.locationName);
    setEditDietaryTags(post.dietaryTags ?? []);
    setEditImageFile(null);
    setEditImagePreview(null);
    setExtendMinutes(0);
    // Reset address search state
    setAddressQuery("");
    setAddressSuggestions([]);
    setSelectedCoords(null);
    setShowAddressSuggestions(false);
    setEditDialogOpen(true);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = "";
    }
  };

  const toggleDietaryTag = (tag: DietaryTag) => {
    setEditDietaryTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleUpdatePost = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editLocation.trim()) {
      toast.error("Location is required");
      return;
    }

    setIsUpdating(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;

      // Upload new image if selected
      if (editImageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": editImageFile.type },
          body: editImageFile,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await updatePost({
        postId: post._id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        foodType: editFoodType,
        locationName: editLocation.trim(),
        dietaryTags: editDietaryTags.length > 0 ? editDietaryTags : undefined,
        imageId,
        extendMinutes: extendMinutes > 0 ? extendMinutes : undefined,
        // Include new coordinates if address was changed
        latitude: selectedCoords?.lat,
        longitude: selectedCoords?.lng,
      });

      toast.success("Post updated successfully!");
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        matchesDiet 
          ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 ring-1 ring-emerald-500/30" 
          : "border-border/50 bg-card/50 hover:shadow-coral-500/5"
      } ${isExpired ? "opacity-60" : ""}`}
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
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <Badge className={`${config.color} gap-1`}>
            <FoodIcon className="h-3 w-3" />
            {config.label}
          </Badge>
          {matchesDiet && (
            <Badge className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 border-none">
              <CheckCircle2 className="h-3 w-3" />
              Match
            </Badge>
          )}
          {isFavorite && (
            <Badge className="gap-1 bg-gradient-to-r from-coral-500 to-amber-500 text-white shadow-lg shadow-coral-500/25">
              <Heart className="h-3 w-3 fill-current" />
              Favorite
            </Badge>
          )}
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
              onClick={handleOpenEditDialog}
              disabled={isExpired}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-coral-500"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
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
      <ResponsiveDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-coral-500" />
              {isCreator ? "Reviews" : userReview ? "Edit Your Review" : "Rate This Food"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {post.title}
              {(post.reviewCount ?? 0) > 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {post.averageRating?.toFixed(1)} ({post.reviewCount} {post.reviewCount === 1 ? "review" : "reviews"})
                </span>
              )}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

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

          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Edit Post Dialog */}
      <ResponsiveDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-coral-500" />
              Edit Post
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Update your food post details
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="What food are you sharing?"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add details about the food..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Food Type */}
            <div className="space-y-2">
              <Label>Food Type</Label>
              <Select value={editFoodType} onValueChange={(v) => setEditFoodType(v as FoodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pizza">🍕 Pizza</SelectItem>
                  <SelectItem value="sandwiches">🥪 Sandwiches</SelectItem>
                  <SelectItem value="snacks">🍿 Snacks</SelectItem>
                  <SelectItem value="drinks">🥤 Drinks</SelectItem>
                  <SelectItem value="desserts">🍰 Desserts</SelectItem>
                  <SelectItem value="asian">🍜 Asian</SelectItem>
                  <SelectItem value="mexican">🌮 Mexican</SelectItem>
                  <SelectItem value="other">🍽️ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address Search */}
            <div className="space-y-2">
              <Label>Change Map Location</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={addressInputRef}
                  placeholder="Search for a new address..."
                  value={addressQuery}
                  onChange={(e) => {
                    setAddressQuery(e.target.value);
                    if (!e.target.value) {
                      setSelectedCoords(null);
                    }
                  }}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowAddressSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {isSearchingAddress && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {selectedCoords && !isSearchingAddress && (
                  <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                )}
                
                {/* Suggestions Dropdown */}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border/50 bg-background shadow-lg">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => handleSelectAddress(suggestion)}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/50"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral-500" />
                        <span className="line-clamp-2">{suggestion.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCoords && (
                <p className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  New location: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                </p>
              )}
              {!selectedCoords && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current map pin location
                </p>
              )}
            </div>

            {/* Location Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location Description *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g., Engineering Building Room 101"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A brief description to help others find the food
              </p>
            </div>

            {/* Dietary Tags */}
            <div className="space-y-2">
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2">
                {(["vegetarian", "vegan", "halal", "kosher", "gluten-free", "dairy-free", "nut-free"] as DietaryTag[]).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={editDietaryTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDietaryTag(tag)}
                    className={editDietaryTags.includes(tag) ? "bg-coral-500 hover:bg-coral-600" : ""}
                  >
                    {dietaryTagConfig[tag].icon} {dietaryTagConfig[tag].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Photo</Label>
              {editImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={editImagePreview}
                    alt="New photo"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveEditImage}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-md hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : post.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={post.imageUrl}
                    alt="Current photo"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <p className="text-xs text-muted-foreground">Upload a new image to replace</p>
                </div>
              ) : null}
              <div>
                <Input
                  ref={editImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="hidden"
                  id="edit-image-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editImageInputRef.current?.click()}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  {post.imageUrl || editImagePreview ? "Change Photo" : "Add Photo"}
                </Button>
              </div>
            </div>

            {/* Extend Time */}
            <div className="space-y-2">
              <Label>Extend Availability</Label>
              <div className="flex items-center gap-2">
                <Select value={extendMinutes.toString()} onValueChange={(v) => setExtendMinutes(parseInt(v))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Don't extend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Don&apos;t extend</SelectItem>
                    <SelectItem value="15">+15 minutes</SelectItem>
                    <SelectItem value="30">+30 minutes</SelectItem>
                    <SelectItem value="60">+1 hour</SelectItem>
                    <SelectItem value="120">+2 hours</SelectItem>
                  </SelectContent>
                </Select>
                {extendMinutes > 0 && (
                  <span className="text-sm text-muted-foreground">
                    <Plus className="inline h-3 w-3" /> {extendMinutes} min
                  </span>
                )}
              </div>
            </div>
          </div>

          <ResponsiveDialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePost}
              disabled={isUpdating || !editTitle.trim() || !editLocation.trim()}
              className="gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Card>
  );
}
