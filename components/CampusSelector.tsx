"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { MapPin, Search, ArrowRight, ArrowLeft, Utensils, Leaf } from "lucide-react";
import { CuisinePreferencesEditor, CuisinePreferences } from "./CuisinePreferences";
import { DietaryRestrictionsSelector, DietaryTag } from "./DietaryRestrictionsSelector";
import { toast } from "sonner";

interface CampusSelectorProps {
  onCampusSelected: () => void;
}

interface CampusInfo {
  _id: Id<"campuses">;
  name: string;
  city: string;
  state: string;
}

type OnboardingStep = "campus" | "cuisine" | "dietary";

export function CampusSelector({ onCampusSelected }: CampusSelectorProps) {
  const [step, setStep] = useState<OnboardingStep>("campus");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<CampusInfo | null>(null);
  const [savedPreferences, setSavedPreferences] = useState<CuisinePreferences | null>(null);

  const campuses = useQuery(api.campuses.search, { searchTerm });
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const handleSelect = (campus: CampusInfo) => {
    setSelectedCampus(campus);
    setSearchTerm("");
  };

  const handleContinueToCuisine = () => {
    if (selectedCampus) {
      setStep("cuisine");
    }
  };

  const handleContinueToDietary = async (preferences: CuisinePreferences) => {
    setSavedPreferences(preferences);
    setStep("dietary");
  };

  const handleSaveDietaryAndComplete = async (dietaryRestrictions: DietaryTag[]) => {
    if (!selectedCampus || !savedPreferences) return;
    
    try {
      await completeOnboarding({
        campusId: selectedCampus._id,
        preferences: savedPreferences,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
      });
      toast.success("Welcome to FreeEats!");
      onCampusSelected();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleSkipDietary = async () => {
    await handleSaveDietaryAndComplete([]);
  };

  const handleSkipCuisine = async () => {
    // Save with default preferences (all 3s) and move to dietary
    const defaults: CuisinePreferences = {
      pizza: 3, sandwiches: 3, snacks: 3, drinks: 3,
      desserts: 3, asian: 3, mexican: 3, other: 3,
    };
    await handleContinueToDietary(defaults);
  };

  // Step 3: Dietary Restrictions
  if (step === "dietary") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-emerald-500/5 p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-outfit text-3xl font-bold tracking-tight">
              Any Dietary Restrictions?
            </h1>
            <p className="mt-2 text-muted-foreground">
              We&apos;ll highlight matching foods for you
            </p>
            {/* Progress indicator */}
            <div className="mt-4 flex justify-center gap-2">
              <div className="h-2 w-8 rounded-full bg-emerald-500/30" />
              <div className="h-2 w-8 rounded-full bg-emerald-500/30" />
              <div className="h-2 w-8 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setStep("cuisine")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cuisine
          </Button>

          {/* Dietary Restrictions Selector */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-xl backdrop-blur-sm">
            <DietaryRestrictionsSelector
              onSave={handleSaveDietaryAndComplete}
              onSkip={handleSkipDietary}
              showSkip={true}
              submitLabel="Start Exploring"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Step 3 of 3
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Cuisine Preferences
  if (step === "cuisine") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-coral-500/5 p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-2xl shadow-coral-500/30">
              <Utensils className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-outfit text-3xl font-bold tracking-tight">
              Rate Your Favorites
            </h1>
            <p className="mt-2 text-muted-foreground">
              Help us show you the food you love first
            </p>
            {/* Progress indicator */}
            <div className="mt-4 flex justify-center gap-2">
              <div className="h-2 w-8 rounded-full bg-coral-500/30" />
              <div className="h-2 w-8 rounded-full bg-coral-500" />
              <div className="h-2 w-8 rounded-full bg-muted" />
            </div>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setStep("campus")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campus
          </Button>

          {/* Cuisine Preferences */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-xl backdrop-blur-sm">
            <CuisinePreferencesEditor
              onSave={handleContinueToDietary}
              onSkip={handleSkipCuisine}
              showSkip={true}
              submitLabel="Next: Dietary Restrictions"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Step 2 of 3 • Higher rated cuisines appear first
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Campus Selection
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-coral-500/5 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-2xl shadow-coral-500/30">
            <MapPin className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-outfit text-3xl font-bold tracking-tight">
            Select Your Campus
          </h1>
          <p className="mt-2 text-muted-foreground">
            Get notified about free food near you
          </p>
          {/* Progress indicator */}
          <div className="mt-4 flex justify-center gap-2">
            <div className="h-2 w-8 rounded-full bg-coral-500" />
            <div className="h-2 w-8 rounded-full bg-muted" />
            <div className="h-2 w-8 rounded-full bg-muted" />
          </div>
        </div>

        {/* Search & Select */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
          <Command className="bg-transparent" shouldFilter={false}>
            <div className="relative border-b border-border/50">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <CommandInput
                placeholder="Type your university name..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="border-0 pl-10 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[350px]">
              <CommandEmpty className="py-8 text-center">
                {searchTerm ? (
                  <div className="text-muted-foreground">
                    No universities found for &quot;{searchTerm}&quot;
                  </div>
                ) : !selectedCampus ? (
                  <div className="space-y-2">
                    <p className="font-medium">Search 380+ universities</p>
                    <p className="text-sm text-muted-foreground">
                      Start typing to find your school
                    </p>
                  </div>
                ) : null}
              </CommandEmpty>
              <CommandGroup>
                {/* Show selected campus at top if it exists and no search term */}
                {selectedCampus && !searchTerm && (
                  <CommandItem
                    key={selectedCampus._id}
                    value={selectedCampus.name}
                    className="cursor-pointer px-4 py-3 bg-coral-500/10 text-coral-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral-500 text-white">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedCampus.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedCampus.city}, {selectedCampus.state} • Selected
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                )}
                {campuses?.map((campus) => (
                  <CommandItem
                    key={campus._id}
                    value={campus.name}
                    onSelect={() => handleSelect(campus)}
                    className={`cursor-pointer px-4 py-3 transition-colors ${
                      selectedCampus?._id === campus._id
                        ? "bg-coral-500/10 text-coral-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          selectedCampus?._id === campus._id
                            ? "bg-coral-500 text-white"
                            : "bg-secondary"
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{campus.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {campus.city}, {campus.state}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinueToCuisine}
          disabled={!selectedCampus}
          className="h-12 w-full gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-lg font-medium text-white shadow-lg shadow-coral-500/25 transition-all hover:from-coral-600 hover:to-coral-700 hover:shadow-xl hover:shadow-coral-500/30"
        >
          Next: Food Preferences
          <ArrowRight className="h-5 w-5" />
        </Button>

        {/* Step indicator */}
        <p className="text-center text-sm text-muted-foreground">
          Step 1 of 3
        </p>
      </div>
    </div>
  );
}
