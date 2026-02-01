"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pizza,
  Sandwich,
  Cookie,
  Coffee,
  Cake,
  Utensils,
  Star,
  Loader2,
} from "lucide-react";

// Cuisine types matching the schema
const CUISINES = [
  { id: "pizza", label: "Pizza", icon: Pizza, emoji: "🍕" },
  { id: "sandwiches", label: "Sandwiches", icon: Sandwich, emoji: "🥪" },
  { id: "snacks", label: "Snacks", icon: Cookie, emoji: "🍿" },
  { id: "drinks", label: "Drinks", icon: Coffee, emoji: "🥤" },
  { id: "desserts", label: "Desserts", icon: Cake, emoji: "🍰" },
  { id: "asian", label: "Asian", icon: Utensils, emoji: "🍜" },
  { id: "mexican", label: "Mexican", icon: Utensils, emoji: "🌮" },
  { id: "other", label: "Other", icon: Utensils, emoji: "🍽️" },
] as const;

export type CuisinePreferences = {
  [key: string]: number | undefined;
};

interface CuisinePreferencesProps {
  initialPreferences?: CuisinePreferences | null;
  onSave: (preferences: CuisinePreferences) => Promise<void>;
  onSkip?: () => void;
  showSkip?: boolean;
  submitLabel?: string;
  isCompact?: boolean;
}

export function CuisinePreferencesEditor({
  initialPreferences,
  onSave,
  onSkip,
  showSkip = false,
  submitLabel = "Save Preferences",
  isCompact = false,
}: CuisinePreferencesProps) {
  const [preferences, setPreferences] = useState<CuisinePreferences>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize preferences from initial values
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    } else {
      // Set all to 3 (neutral) by default
      const defaults: CuisinePreferences = {};
      CUISINES.forEach((c) => {
        defaults[c.id] = 3;
      });
      setPreferences(defaults);
    }
  }, [initialPreferences]);

  const handleRatingChange = (cuisineId: string, rating: number) => {
    setPreferences((prev) => ({
      ...prev,
      [cuisineId]: rating,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(preferences);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isCompact ? "space-y-4" : "space-y-6"}>
      <div className={`grid gap-3 ${isCompact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {CUISINES.map((cuisine) => {
          const rating = preferences[cuisine.id] ?? 3;
          return (
            <Card
              key={cuisine.id}
              className={`overflow-hidden transition-all ${
                rating >= 4
                  ? "border-coral-500/50 bg-coral-500/5"
                  : rating <= 2
                  ? "border-muted bg-muted/30"
                  : ""
              }`}
            >
              <CardContent className={isCompact ? "p-3" : "p-4"}>
                <div className="flex flex-col items-center gap-2">
                  <span className={isCompact ? "text-2xl" : "text-3xl"}>{cuisine.emoji}</span>
                  <span className={`font-medium ${isCompact ? "text-xs" : "text-sm"}`}>
                    {cuisine.label}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(cuisine.id, star)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} transition-colors ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className={`flex ${showSkip ? "justify-between" : "justify-end"} gap-3`}>
        {showSkip && onSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-500/25"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}
