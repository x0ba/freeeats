"use client";

import { useState, useEffect, useRef } from "react";
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
import { MapPin, ArrowRight, ArrowLeft, Utensils, Leaf, Search } from "lucide-react";
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
  const [isSearching, setIsSearching] = useState(false);
  const prevCampusesRef = useRef<CampusInfo[] | undefined>(undefined);

  const campuses = useQuery(api.campuses.search, { searchTerm });
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  // Track when search is in progress
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (campuses !== undefined) {
      setIsSearching(false);
      prevCampusesRef.current = campuses;
    }
  }, [campuses]);

  // Use previous results during loading to prevent list from disappearing
  const displayCampuses = campuses ?? prevCampusesRef.current;

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
      <div className="flex min-h-screen items-center justify-center cork-texture p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            {/* Sticker-style icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-sm bg-forest-500 paper-shadow paper-rotate-3 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border-2 border-amber-300" />
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Any Dietary Restrictions?
            </h1>
            <p className="mt-2 text-muted-foreground">
              We&apos;ll highlight matching foods for you
            </p>

            {/* Pushpin Progress Timeline */}
            <div className="mt-6 flex justify-center items-center gap-2">
              {/* Step 1 - Complete */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-forest-500 flex items-center justify-center">
                    <span className="text-[8px] text-white">✓</span>
                  </div>
                </div>
              </div>
              {/* Connector */}
              <div className="w-12 h-1 bg-primary rounded-full" />
              {/* Step 2 - Complete */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Utensils className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-forest-500 flex items-center justify-center">
                    <span className="text-[8px] text-white">✓</span>
                  </div>
                </div>
              </div>
              {/* Connector */}
              <div className="w-12 h-1 bg-primary rounded-full" />
              {/* Step 3 - Current */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-forest-500 flex items-center justify-center shadow-md border-2 border-forest-400">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  {/* Pushpin on current step */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border border-amber-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setStep("cuisine")}
            className="gap-2 rounded-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cuisine
          </Button>

          {/* Dietary Restrictions Selector - Pinned Card Style */}
          <div className="rounded-sm border-2 border-border bg-card p-6 paper-shadow paper-rotate-1 relative">
            {/* Tape decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/80 dark:bg-amber-900/40 rounded-sm rotate-1 shadow-sm" />
            <DietaryRestrictionsSelector
              onSave={handleSaveDietaryAndComplete}
              onSkip={handleSkipDietary}
              showSkip={true}
              submitLabel="Start Exploring"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground font-display">
            Step 3 of 3
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Cuisine Preferences
  if (step === "cuisine") {
    return (
      <div className="flex min-h-screen items-center justify-center cork-texture p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center">
            {/* Sticker-style icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-sm bg-primary paper-shadow paper-rotate-2 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border-2 border-amber-300" />
              <Utensils className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Rate Your Favorites
            </h1>
            <p className="mt-2 text-muted-foreground">
              Help us show you the food you love first
            </p>

            {/* Pushpin Progress Timeline */}
            <div className="mt-6 flex justify-center items-center gap-2">
              {/* Step 1 - Complete */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-forest-500 flex items-center justify-center">
                    <span className="text-[8px] text-white">✓</span>
                  </div>
                </div>
              </div>
              {/* Connector */}
              <div className="w-12 h-1 bg-primary rounded-full" />
              {/* Step 2 - Current */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-primary">
                    <Utensils className="h-5 w-5 text-white" />
                  </div>
                  {/* Pushpin on current step */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border border-amber-300" />
                </div>
              </div>
              {/* Connector */}
              <div className="w-12 h-1 bg-border rounded-full" />
              {/* Step 3 - Future */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setStep("campus")}
            className="gap-2 rounded-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campus
          </Button>

          {/* Cuisine Preferences - Pinned Card Style */}
          <div className="rounded-sm border-2 border-border bg-card p-6 paper-shadow paper-rotate-3 relative">
            {/* Pushpin decoration */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-terracotta-700 shadow-md border-2 border-primary-foreground" />
            <CuisinePreferencesEditor
              onSave={handleContinueToDietary}
              onSkip={handleSkipCuisine}
              showSkip={true}
              submitLabel="Next: Dietary Restrictions"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground font-display">
            Step 2 of 3 • Higher rated cuisines appear first
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Campus Selection
  return (
    <div className="flex min-h-screen items-center justify-center cork-texture p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Sticker-style icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-sm bg-primary paper-shadow paper-rotate-1 relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border-2 border-amber-300" />
            <MapPin className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Select Your Campus
          </h1>
          <p className="mt-2 text-muted-foreground">
            Get notified about free food near you
          </p>

          {/* Pushpin Progress Timeline */}
          <div className="mt-6 flex justify-center items-center gap-2">
            {/* Step 1 - Current */}
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-primary">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                {/* Pushpin on current step */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border border-amber-300" />
              </div>
            </div>
            {/* Connector */}
            <div className="w-12 h-1 bg-border rounded-full" />
            {/* Step 2 - Future */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {/* Connector */}
            <div className="w-12 h-1 bg-border rounded-full" />
            {/* Step 3 - Future */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Select - Pinned Card */}
        <div className="overflow-hidden rounded-sm border-2 border-border bg-card paper-shadow paper-rotate-2 relative">
          {/* Tape decoration */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/80 dark:bg-amber-900/40 rounded-sm -rotate-1 shadow-sm z-10" />

          <Command className="bg-transparent" shouldFilter={false}>
            <div className="flex items-center border-b-2 border-border px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <CommandInput
                placeholder="Type your university name..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="border-0 focus:ring-0 bg-transparent"
              />
            </div>
            <CommandList className="max-h-[350px]">
              <CommandEmpty className="py-8 text-center">
                {!isSearching && (
                  searchTerm ? (
                    <div className="text-muted-foreground">
                      No universities found for &quot;{searchTerm}&quot;
                    </div>
                  ) : !selectedCampus ? (
                    <div className="space-y-2">
                      <p className="font-display font-medium">Search 380+ universities</p>
                      <p className="text-sm text-muted-foreground">
                        Start typing to find your school
                      </p>
                    </div>
                  ) : null
                )}
              </CommandEmpty>
              <CommandGroup>
                {/* Show selected campus at top if it exists and no search term */}
                {selectedCampus && !searchTerm && (
                  <CommandItem
                    key={selectedCampus._id}
                    value={selectedCampus.name}
                    className="cursor-pointer px-4 py-3 bg-primary/10 text-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-white shadow-sm">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium font-display">{selectedCampus.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedCampus.city}, {selectedCampus.state} • Selected
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                )}
                {displayCampuses?.map((campus) => (
                  <CommandItem
                    key={campus._id}
                    value={campus.name}
                    onSelect={() => handleSelect(campus)}
                    className={`cursor-pointer px-4 py-3 transition-colors ${
                      selectedCampus?._id === campus._id
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-sm ${
                          selectedCampus?._id === campus._id
                            ? "bg-primary text-white shadow-sm"
                            : "bg-secondary"
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium font-display">{campus.name}</div>
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

        {/* Continue Button - Pushpin Style */}
        <Button
          onClick={handleContinueToCuisine}
          disabled={!selectedCampus}
          className="h-12 w-full gap-2 bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow rounded-sm relative font-display text-lg"
        >
          {/* Pushpin decoration */}
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border-2 border-amber-300" />
          Next: Food Preferences
          <ArrowRight className="h-5 w-5" />
        </Button>

        {/* Step indicator */}
        <p className="text-center text-sm text-muted-foreground font-display">
          Step 1 of 3
        </p>
      </div>
    </div>
  );
}
