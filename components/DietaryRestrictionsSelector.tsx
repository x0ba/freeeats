"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

// Dietary restriction types matching the schema
const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥬", description: "No meat or fish" },
  { id: "vegan", label: "Vegan", emoji: "🌱", description: "No animal products" },
  { id: "halal", label: "Halal", emoji: "☪️", description: "Halal certified" },
  { id: "kosher", label: "Kosher", emoji: "✡️", description: "Kosher certified" },
  { id: "gluten-free", label: "Gluten-Free", emoji: "🌾", description: "No gluten" },
  { id: "dairy-free", label: "Dairy-Free", emoji: "🥛", description: "No dairy" },
  { id: "nut-free", label: "Nut-Free", emoji: "🥜", description: "No nuts" },
] as const;

export type DietaryTag = "vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free";

interface DietaryRestrictionsSelectorProps {
  initialRestrictions?: DietaryTag[] | null;
  onSave: (restrictions: DietaryTag[]) => Promise<void>;
  onSkip?: () => void;
  showSkip?: boolean;
  submitLabel?: string;
  isCompact?: boolean;
}

export function DietaryRestrictionsSelector({
  initialRestrictions,
  onSave,
  onSkip,
  showSkip = false,
  submitLabel = "Save Preferences",
  isCompact = false,
}: DietaryRestrictionsSelectorProps) {
  const [selected, setSelected] = useState<Set<DietaryTag>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from initial values
  useEffect(() => {
    if (initialRestrictions) {
      setSelected(new Set(initialRestrictions));
    }
  }, [initialRestrictions]);

  const toggleRestriction = (id: DietaryTag) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(Array.from(selected));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isCompact ? "space-y-4" : "space-y-6"}>
      <div className={`grid ${isCompact ? "gap-2 grid-cols-3 sm:grid-cols-4" : "gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {DIETARY_RESTRICTIONS.map((restriction) => {
          const isSelected = selected.has(restriction.id);
          return (
            <Card
              key={restriction.id}
              onClick={() => toggleRestriction(restriction.id)}
              className={`relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                isSelected
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/10 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/30"
                  : "border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
              }`}
            >
              {/* Selected checkmark indicator */}
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              )}
              
              <CardContent className={isCompact ? "p-2" : "p-4"}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span 
                    className={`transition-transform duration-300 ${
                      isSelected ? "scale-110" : ""
                    } ${isCompact ? "text-xl" : "text-3xl"}`}
                  >
                    {restriction.emoji}
                  </span>
                  <span 
                    className={`font-medium transition-colors ${
                      isSelected ? "text-emerald-600 dark:text-emerald-400" : ""
                    } ${isCompact ? "text-xs" : "text-sm"}`}
                  >
                    {restriction.label}
                  </span>
                  {!isCompact && (
                    <span className="text-xs text-muted-foreground">
                      {restriction.description}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection summary */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2">
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Selected:
          </span>
          {Array.from(selected).map((id) => {
            const restriction = DIETARY_RESTRICTIONS.find((r) => r.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                {restriction?.emoji} {restriction?.label}
              </span>
            );
          })}
        </div>
      )}

      <div className={`flex ${showSkip ? "justify-between" : "justify-end"} gap-3`}>
        {showSkip && onSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
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
