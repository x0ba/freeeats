"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2, MapPin, Utensils, X, Upload, Search, CheckCircle2, Camera } from "lucide-react";

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";

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

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campusId: Id<"campuses">;
  campusCenter: [number, number];
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

const durations = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

export function AddFoodDialog({ open, onOpenChange, campusId, campusCenter }: AddFoodDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [foodType, setFoodType] = useState<FoodType>("other");
  const [locationName, setLocationName] = useState("");
  const [duration, setDuration] = useState("60");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);

  // Address search state
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddressInputFocused, setIsAddressInputFocused] = useState(false);

  const debouncedAddressQuery = useDebounce(addressQuery, 400);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const createPost = useAction(api.food.create);
  const generateUploadUrl = useMutation(api.food.generateUploadUrl);

  // Geocoding search effect
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search near campus for more relevant results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}` +
        `&viewbox=${campusCenter[1] - 0.1},${campusCenter[0] + 0.1},${campusCenter[1] + 0.1},${campusCenter[0] - 0.1}` +
        `&bounded=0&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      const data: AddressSuggestion[] = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [campusCenter]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedAddressQuery) {
      searchAddress(debouncedAddressQuery);
    } else {
      setAddressSuggestions([]);
    }
  }, [debouncedAddressQuery, searchAddress]);

  // Handle selecting an address suggestion
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setSelectedCoords({ lat, lng });
    setAddressQuery(suggestion.display_name);
    setAddressSuggestions([]);

    // If location name is empty, set a shortened version as the location name
    if (!locationName.trim()) {
      // Extract the first part of the address (usually the building/place name)
      const parts = suggestion.display_name.split(',');
      setLocationName(parts.slice(0, 2).join(', ').trim());
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFoodType("other");
    setLocationName("");
    setDuration("60");
    setDietaryTags([]);
    setAddressQuery("");
    setSelectedCoords(null);
    setAddressSuggestions([]);
    clearImage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    setIsSubmitting(true);

    try {
      let imageId: Id<"_storage"> | undefined;

      // Upload image if present
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      // Create the post
      await createPost({
        title: title.trim(),
        description: description.trim() || undefined,
        foodType,
        campusId,
        locationName: locationName.trim(),
        latitude: selectedCoords?.lat ?? campusCenter[0] + (Math.random() - 0.5) * 0.002,
        longitude: selectedCoords?.lng ?? campusCenter[1] + (Math.random() - 0.5) * 0.002,
        durationMinutes: parseInt(duration),
        imageId,
        dietaryTags: dietaryTags.length > 0 ? dietaryTags as ("vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free" | "no-beef")[] : undefined,
      });

      resetForm();
      onOpenChange(false);
      toast.success("Food shared successfully! 🎉");
    } catch {
      toast.error("This post is not about food");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px] border-2 border-border bg-card paper-shadow">
        <ResponsiveDialogHeader className="pt-4">
          <ResponsiveDialogTitle className="flex items-center gap-2 font-display text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary shadow-md">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            Share Free Food
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Help fellow students find free food on campus!
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload - Polaroid Style */}
          <div className="space-y-2">
            <Label className="font-display">Photo</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed border-border bg-secondary/30 p-6 transition-colors hover:border-primary/50 hover:bg-secondary/50 ${
                imagePreview ? "p-0 bg-cream-50" : ""
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full p-3 pb-8 bg-white shadow-sm">
                  {/* Polaroid frame */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full aspect-[4/3] object-cover rounded-sm"
                  />
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-xs text-muted-foreground font-handwriting">📷 Food Photo</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    className="absolute right-4 top-4 h-7 w-7 rounded-full shadow-md"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-2 rounded-sm bg-primary/10 p-3 border border-primary/20">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Click to add a photo
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Polaroid style
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Title - Underline Style Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-display">What&apos;s the food? *</Label>
            <div className="relative">
              <Input
                id="title"
                placeholder="e.g., Leftover pizza from club meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-0 border-b-2 border-border bg-transparent rounded-none px-0 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          {/* Food Type - Sticker Style */}
          <div className="space-y-2">
            <Label className="font-display">Food Type</Label>
            <Select value={foodType} onValueChange={(v) => setFoodType(v as FoodType)}>
              <SelectTrigger className="border-2 border-border bg-card rounded-sm focus:ring-primary/20">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="border-2 border-border">
                {foodTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="rounded-sm">
                    <span className="flex items-center gap-2">
                      <span>{type.emoji}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Search */}
          <div className="space-y-2">
            <Label className="font-display">Search Address for Map Pin</Label>
            <div className="relative">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={addressInputRef}
                placeholder="Start typing an address..."
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value);
                  if (!e.target.value) {
                    setSelectedCoords(null);
                  }
                }}
                onFocus={() => setIsAddressInputFocused(true)}
                onBlur={() => {
                  // Delay hiding to allow click events on suggestions to fire
                  setTimeout(() => setIsAddressInputFocused(false), 150);
                }}
                className="border-0 border-b-2 border-border bg-transparent rounded-none pl-6 pr-10 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {isSearching && (
                <Loader2 className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {selectedCoords && !isSearching && (
                <CheckCircle2 className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-500" />
              )}

              {/* Suggestions Dropdown */}
              {isAddressInputFocused && addressSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border-2 border-border bg-card shadow-lg">
                  {addressSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handleSelectAddress(suggestion)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/50"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="line-clamp-2">{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCoords && (
              <p className="flex items-center gap-1 text-xs text-forest-500 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Location set at {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
              </p>
            )}
            {!selectedCoords && addressQuery && !isSearching && addressSuggestions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No addresses found. The pin will appear near campus center.
              </p>
            )}
          </div>

          {/* Location Name */}
          <div className="space-y-2">
            <Label htmlFor="location" className="font-display">Location Description *</Label>
            <div className="relative">
              <MapPin className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="location"
                placeholder="e.g., Engineering Building Room 101"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="border-0 border-b-2 border-border bg-transparent rounded-none pl-6 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A brief description to help others find the food
            </p>
          </div>

          {/* Duration - Stamp Style */}
          <div className="space-y-2">
            <Label className="font-display">How long will it last?</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="border-2 border-border bg-card rounded-sm focus:ring-primary/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select duration" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-2 border-border">
                {durations.map((d) => (
                  <SelectItem key={d.value} value={d.value.toString()} className="rounded-sm">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dietary Tags - Paper Tag Style */}
          <div className="space-y-2">
            <Label className="font-display">Dietary Options</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "vegetarian", label: "Vegetarian", icon: "🥬" },
                { id: "vegan", label: "Vegan", icon: "🌱" },
                { id: "halal", label: "Halal", icon: "☪️" },
                { id: "kosher", label: "Kosher", icon: "✡️" },
                { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
                { id: "dairy-free", label: "Dairy-Free", icon: "🥛" },
                { id: "nut-free", label: "Nut-Free", icon: "🥜" },
                { id: "no-beef", label: "No Beef", icon: "🐄" },
              ].map((tag) => {
                const isSelected = dietaryTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setDietaryTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(t => t !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className={`flex items-center gap-2 rounded-sm border-2 px-3 py-2 text-left text-sm transition-all ${
                      isSelected
                        ? "border-forest-500 bg-forest-500/10 text-forest-500 shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span className={isSelected ? "font-medium" : ""}>{tag.label}</span>
                    {isSelected && <span className="ml-auto">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-display">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="e.g., About 3 boxes left, vegetarian options available"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none border-2 border-border bg-card rounded-sm focus:border-primary focus-visible:ring-primary/20"
            />
          </div>

          <ResponsiveDialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !locationName.trim() || isSubmitting}
              className="gap-2 bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow rounded-sm relative"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Share Food
                </>
              )}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
