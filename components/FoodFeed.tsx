"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FoodCard } from "./FoodCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Pizza, Sandwich, Cookie, Coffee, UtensilsCrossed, Salad } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { DietaryTag } from "./DietaryRestrictionsSelector";

// Max distance in meters (20 miles = 32186.88 meters)
const MAX_DISTANCE_METERS = 32186.88;

// Calculate distance between two points in meters (Haversine formula)
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";

interface FoodFeedProps {
  campusId: Id<"campuses">;
}

const filterOptions: { value: FoodType | "all"; label: string; icon: typeof Pizza; emoji: string }[] = [
  { value: "all", label: "All", icon: UtensilsCrossed, emoji: "🍴" },
  { value: "pizza", label: "Pizza", icon: Pizza, emoji: "🍕" },
  { value: "sandwiches", label: "Sandwiches", icon: Sandwich, emoji: "🥪" },
  { value: "snacks", label: "Snacks", icon: Cookie, emoji: "🍿" },
  { value: "drinks", label: "Drinks", icon: Coffee, emoji: "☕" },
  { value: "desserts", label: "Desserts", icon: Cookie, emoji: "🍰" },
  { value: "asian", label: "Asian", icon: Salad, emoji: "🍜" },
  { value: "mexican", label: "Mexican", icon: Salad, emoji: "🌮" },
];

export function FoodFeed({ campusId }: FoodFeedProps) {
  const [filter, setFilter] = useState<FoodType | "all">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useImperial, setUseImperial] = useState(true); // Default to imperial (miles/feet)
  
  const posts = useQuery(api.food.listByCampus, { campusId });
  const cuisinePreferences = useQuery(api.users.getCuisinePreferences);
  const dietaryRestrictions = useQuery(api.users.getDietaryRestrictions);

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log("Error getting location:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Check if a food type is a "favorite" (rated 4+ by user)
  const isFavorite = (foodType: FoodType): boolean => {
    if (!cuisinePreferences) return false;
    const rating = cuisinePreferences[foodType as keyof typeof cuisinePreferences];
    return typeof rating === "number" && rating >= 4;
  };

  // Get effective rating for sorting (unrated posts = 2.5)
  const getEffectiveRating = (post: { averageRating?: number; reviewCount?: number }): number => {
    return (post.reviewCount ?? 0) > 0 ? (post.averageRating ?? 2.5) : 2.5;
  };

  // Compute filtered and sorted posts
  const sortedAndFilteredPosts = useMemo(() => {
    if (!posts) return undefined;

    // Apply food type filter
    const filtered = filter === "all" ? posts : posts.filter((post) => post.foodType === filter);

    // Add distance info
    const postsWithDistance = filtered.map((post) => {
      const distance = userLocation
        ? getDistanceMeters(userLocation.lat, userLocation.lng, post.latitude, post.longitude)
        : null;
      return { ...post, distance };
    });

    // Filter out posts more than 20 miles away (only if user location is available)
    const nearbyPosts = userLocation
      ? postsWithDistance.filter((post) => post.distance === null || post.distance <= MAX_DISTANCE_METERS)
      : postsWithDistance;

    // Sort with priority: 1) Rating, 2) Favorite (if rating diff <= 1), 3) Distance
    return nearbyPosts.sort((a, b) => {
      const ratingA = getEffectiveRating(a);
      const ratingB = getEffectiveRating(b);
      const ratingDiff = Math.abs(ratingA - ratingB);

      // Priority 1: If rating difference > 1 star, higher rating wins
      if (ratingDiff > 1) {
        return ratingB - ratingA; // Higher rating first
      }

      // Priority 2: If rating difference <= 1 star, check favorites
      const aIsFavorite = isFavorite(a.foodType);
      const bIsFavorite = isFavorite(b.foodType);
      if (aIsFavorite !== bIsFavorite) {
        return aIsFavorite ? -1 : 1; // Favorites first
      }

      // Priority 3: Sort by distance (closer first)
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      // If one has distance and the other doesn't, prefer the one with distance
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;

      // Final fallback: newer posts first
      return b._creationTime - a._creationTime;
    });
  }, [posts, filter, userLocation, cuisinePreferences]);

  if (posts === undefined) {
    return (
      <div className="space-y-6 p-4">
        {/* Filter Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-sm" />
          ))}
        </div>
        {/* Masonry Skeleton */}
        <div className="masonry-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="masonry-item space-y-3">
              <Skeleton className="aspect-[4/3] rounded-sm" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Filter Pills - Tab style */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((option) => {
          const isActive = filter === option.value;
          const count = option.value === "all"
            ? posts.length
            : posts.filter((p) => p.foodType === option.value).length;

          if (option.value !== "all" && count === 0) return null;

          return (
            <Badge
              key={option.value}
              variant={isActive ? "default" : "secondary"}
              onClick={() => setFilter(option.value)}
              className={`cursor-pointer gap-1.5 whitespace-nowrap px-3 py-2 transition-all rounded-sm border-2 text-sm font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card border-border hover:bg-secondary hover:border-primary/30"
              }`}
            >
              <span>{option.emoji}</span>
              {option.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-sm text-xs ${
                isActive ? "bg-primary-foreground/20" : "bg-muted"
              }`}>
                {count}
              </span>
            </Badge>
          );
        })}
      </div>

      {/* Distance unit toggle */}
      {userLocation && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Distance:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseImperial(!useImperial)}
            className="h-6 px-2 text-xs rounded-sm border"
          >
            {useImperial ? "mi" : "km"}
          </Button>
        </div>
      )}

      {/* Masonry Grid */}
      {sortedAndFilteredPosts && sortedAndFilteredPosts.length > 0 ? (
        <div className="masonry-grid">
          {sortedAndFilteredPosts.map((post, index) => {
            const matchesDiet = dietaryRestrictions && dietaryRestrictions.length > 0
              ? dietaryRestrictions.every(tag => post.dietaryTags?.includes(tag as DietaryTag))
              : false;

            return (
              <div
                key={post._id}
                className="masonry-item animate-stagger"
                style={{ '--stagger-index': index } as React.CSSProperties}
              >
                <FoodCard
                  post={post}
                  isFavorite={isFavorite(post.foodType)}
                  matchesDiet={matchesDiet}
                  index={index}
                  distance={post.distance ?? undefined}
                  useImperial={useImperial}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {/* Illustrated empty state */}
          <div className="relative mb-6">
            {/* Bulletin board background */}
            <div className="w-40 h-40 rounded-sm bg-secondary border-2 border-border cork-texture flex items-center justify-center">
              {/* Empty note card */}
              <div className="relative w-28 h-32 bg-card rounded-sm paper-shadow paper-rotate-2 border-2 border-border flex flex-col items-center justify-center p-3">
                {/* Pushpin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-terracotta-700 shadow-md border-2 border-primary-foreground" />
                <span className="text-4xl mb-2">🍽️</span>
                <div className="w-full h-1 bg-border/50 rounded-full mb-1" />
                <div className="w-3/4 h-1 bg-border/50 rounded-full mb-1" />
                <div className="w-1/2 h-1 bg-border/50 rounded-full" />
              </div>
            </div>
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground">
            No free food right now
          </h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Be the first to pin some free food on the board! Click the &quot;Add Food&quot; button to share with your campus.
          </p>
        </div>
      )}
    </div>
  );
}
