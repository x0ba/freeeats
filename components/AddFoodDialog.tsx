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
import { Camera, Clock, Loader2, MapPin, Utensils, X, Upload, Search, CheckCircle2 } from "lucide-react";

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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
      setShowSuggestions(data.length > 0);
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
      setShowSuggestions(false);
    }
  }, [debouncedAddressQuery, searchAddress]);
  
  // Handle selecting an address suggestion
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setSelectedCoords({ lat, lng });
    setAddressQuery(suggestion.display_name);
    setShowSuggestions(false);
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
    setShowSuggestions(false);
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
        dietaryTags: dietaryTags.length > 0 ? dietaryTags as ("vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free")[] : undefined,
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
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 font-outfit text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-coral-500 to-coral-600">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            Share Free Food
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Help fellow students find free food on campus!
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-secondary/30 p-6 transition-colors hover:border-coral-500/50 hover:bg-secondary/50 ${
                imagePreview ? "p-0" : ""
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-48 w-full rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-2 rounded-full bg-coral-500/10 p-3">
                    <Camera className="h-6 w-6 text-coral-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Click to add a photo
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">What&apos;s the food? *</Label>
            <Input
              id="title"
              placeholder="e.g., Leftover pizza from club meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-border/50 bg-secondary/30"
              required
            />
          </div>

          {/* Food Type */}
          <div className="space-y-2">
            <Label>Food Type</Label>
            <Select value={foodType} onValueChange={(v) => setFoodType(v as FoodType)}>
              <SelectTrigger className="border-border/50 bg-secondary/30">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {foodTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
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
            <Label>Search Address for Map Pin</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                onFocus={() => {
                  if (addressSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="border-border/50 bg-secondary/30 pl-10 pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {selectedCoords && !isSearching && (
                <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
              )}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
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
            <Label htmlFor="location">Location Description *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="location"
                placeholder="e.g., Engineering Building Room 101"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="border-border/50 bg-secondary/30 pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A brief description to help others find the food
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>How long will it last?</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="border-border/50 bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select duration" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {durations.map((d) => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <Label>Dietary Options</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "vegetarian", label: "Vegetarian", icon: "🥬" },
                { id: "vegan", label: "Vegan", icon: "🌱" },
                { id: "halal", label: "Halal", icon: "☪️" },
                { id: "kosher", label: "Kosher", icon: "✡️" },
                { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
                { id: "dairy-free", label: "Dairy-Free", icon: "🥛" },
                { id: "nut-free", label: "Nut-Free", icon: "🥜" },
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
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                      isSelected
                        ? "border-green-500/50 bg-green-500/10 text-green-500"
                        : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span className={isSelected ? "text-green-500 font-medium" : ""}>{tag.label}</span>
                    {isSelected && <span className="ml-auto text-green-500">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="e.g., About 3 boxes left, vegetarian options available"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none border-border/50 bg-secondary/30"
            />
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !locationName.trim() || isSubmitting}
              className="gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white"
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
