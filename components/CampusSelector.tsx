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
import { MapPin, Search, ArrowRight, Loader2 } from "lucide-react";

interface CampusSelectorProps {
  onCampusSelected: () => void;
}

export function CampusSelector({ onCampusSelected }: CampusSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampusId, setSelectedCampusId] = useState<Id<"campuses"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campuses = useQuery(api.campuses.search, { searchTerm });
  const setCampus = useMutation(api.users.setCampus);

  const handleSelect = (campusId: Id<"campuses">) => {
    setSelectedCampusId(campusId);
  };

  const handleContinue = async () => {
    if (!selectedCampusId) return;
    
    setIsSubmitting(true);
    try {
      await setCampus({ campusId: selectedCampusId });
      onCampusSelected();
    } catch (error) {
      console.error("Failed to set campus:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCampus = campuses?.find((c) => c._id === selectedCampusId);

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
        </div>

        {/* Search & Select */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
          <Command className="bg-transparent">
            <div className="relative border-b border-border/50">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <CommandInput
                placeholder="Search for your university..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="border-0 pl-10 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-8 text-center text-muted-foreground">
                No universities found.
              </CommandEmpty>
              <CommandGroup>
                {campuses?.map((campus) => (
                  <CommandItem
                    key={campus._id}
                    value={campus.name}
                    onSelect={() => handleSelect(campus._id)}
                    className={`cursor-pointer px-4 py-3 transition-colors ${
                      selectedCampusId === campus._id
                        ? "bg-coral-500/10 text-coral-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          selectedCampusId === campus._id
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
          onClick={handleContinue}
          disabled={!selectedCampusId || isSubmitting}
          className="h-12 w-full gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-lg font-medium text-white shadow-lg shadow-coral-500/25 transition-all hover:from-coral-600 hover:to-coral-700 hover:shadow-xl hover:shadow-coral-500/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Continue to {selectedCampus?.name ?? "FreeEats"}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        {/* Skip */}
        <p className="text-center text-sm text-muted-foreground">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}
