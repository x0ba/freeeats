"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Heart, Utensils, ArrowRight, Loader2, Sparkles } from "lucide-react";

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";
type DietaryTag = "vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free";

interface PreferencesSelectorProps {
  onPreferencesSelected: () => void;
}

const foodTypes: { value: FoodType; label: string; emoji: string }[] = [
  { value: "pizza", label: "Pizza", emoji: "🍕" },
  { value: "sandwiches", label: "Sandwiches", emoji: "🥪" },
  { value: "snacks", label: "Snacks", emoji: "🍿" },
  { value: "drinks", label: "Drinks", emoji: "☕" },
  { value: "desserts", label: "Desserts", emoji: "🍰" },
  { value: "asian", label: "Asian", emoji: "🍜" },
  { value: "mexican", label: "Mexican", emoji: "🌮" },
  { value: "other", label: "Other", emoji: "🍽️" },
];

const dietaryTags: { id: DietaryTag; label: string; icon: string }[] = [
  { id: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "halal", label: "Halal", icon: "☪️" },
  { id: "kosher", label: "Kosher", icon: "✡️" },
  { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
  { id: "dairy-free", label: "Dairy-Free", icon: "🥛" },
  { id: "nut-free", label: "Nut-Free", icon: "🥜" },
];

export function PreferencesSelector({ onPreferencesSelected }: PreferencesSelectorProps) {
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<FoodType[]>([]);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<DietaryTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setPreferences = useMutation(api.users.setPreferences);

  const toggleFoodType = (type: FoodType) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleDietaryTag = (tag: DietaryTag) => {
    setSelectedDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await setPreferences({
        preferredFoodTypes: selectedFoodTypes.length > 0 ? selectedFoodTypes : undefined,
        dietaryRestrictions: selectedDietaryTags.length > 0 ? selectedDietaryTags : undefined,
      });
      onPreferencesSelected();
    } catch (error) {
      console.error("Failed to set preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Still need to mark preferences as set (with empty arrays or just proceed)
      await setPreferences({
        preferredFoodTypes: [],
        dietaryRestrictions: [],
      });
      onPreferencesSelected();
    } catch (error) {
      console.error("Failed to skip preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-coral-500/5 p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-2xl shadow-coral-500/30">
            <Heart className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-outfit text-3xl font-bold tracking-tight">
            What Do You Like?
          </h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;ll prioritize these foods in your feed
          </p>
        </div>

        {/* Food Types Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Utensils className="h-4 w-4" />
            <span>Favorite Food Types</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {foodTypes.map((type) => {
              const isSelected = selectedFoodTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleFoodType(type.value)}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                    isSelected
                      ? "border-coral-500/50 bg-gradient-to-br from-coral-500/10 to-coral-600/10 shadow-lg shadow-coral-500/10"
                      : "border-border/50 bg-card/50 hover:border-coral-500/30 hover:bg-card/80"
                  }`}
                >
                  <span className={`text-2xl transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-105"}`}>
                    {type.emoji}
                  </span>
                  <span className={`text-xs font-medium ${isSelected ? "text-coral-500" : "text-muted-foreground"}`}>
                    {type.label}
                  </span>
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-white shadow-md">
                      <span className="text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Restrictions Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Dietary Preferences</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {dietaryTags.map((tag) => {
              const isSelected = selectedDietaryTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleDietaryTag(tag.id)}
                  className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                    isSelected
                      ? "border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10 shadow-lg shadow-green-500/10"
                      : "border-border/50 bg-card/50 hover:border-green-500/30 hover:bg-card/80"
                  }`}
                >
                  <span className={`text-xl transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-105"}`}>
                    {tag.icon}
                  </span>
                  <span className={`text-sm font-medium ${isSelected ? "text-green-500" : "text-muted-foreground"}`}>
                    {tag.label}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-green-500">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="h-12 w-full gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-lg font-medium text-white shadow-lg shadow-coral-500/25 transition-all hover:from-coral-600 hover:to-coral-700 hover:shadow-xl hover:shadow-coral-500/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-sm text-muted-foreground">
          You can change these later in settings
        </p>
      </div>
    </div>
  );
}
