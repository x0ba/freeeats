"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FoodCard } from "./FoodCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { Pizza, Sandwich, Cookie, Coffee, UtensilsCrossed, Salad } from "lucide-react";
import { useState } from "react";

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";

interface FoodFeedProps {
  campusId: Id<"campuses">;
}

const filterOptions: { value: FoodType | "all"; label: string; icon: typeof Pizza }[] = [
  { value: "all", label: "All", icon: UtensilsCrossed },
  { value: "pizza", label: "Pizza", icon: Pizza },
  { value: "sandwiches", label: "Sandwiches", icon: Sandwich },
  { value: "snacks", label: "Snacks", icon: Cookie },
  { value: "drinks", label: "Drinks", icon: Coffee },
  { value: "desserts", label: "Desserts", icon: Cookie },
  { value: "asian", label: "Asian", icon: Salad },
  { value: "mexican", label: "Mexican", icon: Salad },
];

export function FoodFeed({ campusId }: FoodFeedProps) {
  const [filter, setFilter] = useState<FoodType | "all">("all");
  const posts = useQuery(api.food.listByCampus, { campusId });

  const filteredPosts = posts?.filter((post) => 
    filter === "all" ? true : post.foodType === filter
  );

  if (posts === undefined) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((option) => {
          const Icon = option.icon;
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
              className={`cursor-pointer gap-1.5 whitespace-nowrap px-3 py-1.5 transition-all ${
                isActive
                  ? "bg-coral-500 text-white hover:bg-coral-600"
                  : "bg-secondary/80 hover:bg-secondary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              <span className="ml-0.5 opacity-70">({count})</span>
            </Badge>
          );
        })}
      </div>

      {/* Posts Grid */}
      {filteredPosts && filteredPosts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <FoodCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-secondary p-6">
            <Pizza className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-outfit text-xl font-semibold">No free food right now</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Be the first to share free food on campus! Click the &quot;Add Food&quot; button to get started.
          </p>
        </div>
      )}
    </div>
  );
}
