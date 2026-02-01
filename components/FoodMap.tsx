"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import { DivIcon } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Heart } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import "leaflet/dist/leaflet.css";

type FoodType = "pizza" | "sandwiches" | "snacks" | "drinks" | "desserts" | "asian" | "mexican" | "other";
type DietaryTag = "vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free";

interface FoodPost {
  _id: Id<"foodPosts">;
  title: string;
  description?: string;
  foodType: FoodType;
  locationName: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  expiresAt: number;
  timeRemaining: number;
  creator: { name: string; imageUrl?: string } | null;
  dietaryTags?: DietaryTag[];
}

type CuisinePreferences = {
  [key in FoodType]?: number;
};

interface FoodMapProps {
  posts: FoodPost[];
  center: [number, number];
  zoom?: number;
  onMarkerClick?: (post: FoodPost) => void;
  className?: string;
}

// Food emoji for markers
const foodEmojis: Record<FoodType, string> = {
  pizza: "🍕",
  sandwiches: "🥪",
  snacks: "🍿",
  drinks: "☕",
  desserts: "🍰",
  asian: "🍜",
  mexican: "🌮",
  other: "🍽️",
};

const dietaryTagConfig: Record<DietaryTag, { icon: string; label: string }> = {
  vegetarian: { icon: "🥬", label: "Vegetarian" },
  vegan: { icon: "🌱", label: "Vegan" },
  halal: { icon: "☪️", label: "Halal" },
  kosher: { icon: "✡️", label: "Kosher" },
  "gluten-free": { icon: "🌾", label: "Gluten-Free" },
  "dairy-free": { icon: "🥛", label: "Dairy-Free" },
  "nut-free": { icon: "🥜", label: "Nut-Free" },
};

function createFoodMarker(foodType: FoodType, isExpiringSoon: boolean, isFavorite: boolean): DivIcon {
  const emoji = foodEmojis[foodType];
  const pulseClass = isExpiringSoon ? "animate-pulse" : "";
  // Use gold/amber gradient for favorites, coral for regular
  const bgGradient = isFavorite 
    ? "linear-gradient(135deg, #F59E0B, #FBBF24)" 
    : "linear-gradient(135deg, #FF6B6B, #FF8E8E)";
  const shadowColor = isFavorite 
    ? "rgba(245, 158, 11, 0.5)" 
    : "rgba(255, 107, 107, 0.4)";
  const favoriteHeart = isFavorite 
    ? `<div style="
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #FF6B6B, #F59E0B);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transform: rotate(45deg);
      "><span style="transform: rotate(-45deg);">❤️</span></div>`
    : "";
  
  return new DivIcon({
    html: `
      <div class="food-marker ${pulseClass}" style="
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: ${bgGradient};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px ${shadowColor};
        border: 3px solid white;
        position: relative;
      ">
        <span style="transform: rotate(45deg);">${emoji}</span>
        ${favoriteHeart}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "food-marker-container",
  });
}

function createUserLocationMarker(): DivIcon {
  return new DivIcon({
    html: `
      <div class="user-location-marker" style="
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 24px;
          height: 24px;
          background: #3B82F6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          animation: userPulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          width: 48px;
          height: 48px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          animation: userPulseRing 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes userPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes userPulseRing {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    className: "user-location-container",
  });
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMins}m`;
  return `${Math.floor(hours / 24)}d left`;
}

// Component to recenter map when center changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export function FoodMap({ posts, center, zoom = 15, onMarkerClick, className = "" }: FoodMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const cuisinePreferences = useQuery(api.users.getCuisinePreferences) as CuisinePreferences | null | undefined;

  // Check if a food type is a "favorite" (rated 4+ by user)
  const isFavorite = (foodType: FoodType): boolean => {
    if (!cuisinePreferences) return false;
    const rating = cuisinePreferences[foodType];
    return typeof rating === "number" && rating >= 4;
  };

  // Track theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    // Initial check
    checkTheme();
    
    // Watch for class changes on html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);
  
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
          accuracy: position.coords.accuracy,
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

  const markers = useMemo(() => {
    return posts.map((post) => {
      const isExpiringSoon = post.timeRemaining < 1800000; // 30 minutes
      const postIsFavorite = isFavorite(post.foodType);
      const marker = createFoodMarker(post.foodType, isExpiringSoon, postIsFavorite);
      return { post, marker, isFavorite: postIsFavorite };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, cuisinePreferences]);

  const userLocationMarker = useMemo(() => createUserLocationMarker(), []);

  // Tile layer URLs for light/dark modes (CartoDB Positron/Dark Matter)
  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: isDarkMode ? "#1a1a2e" : "#f5f5f0" }}
      >
        <TileLayer
          key={isDarkMode ? "dark" : "light"}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        <MapRecenter center={center} />
        
        {/* User location marker with accuracy circle */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy}
              pathOptions={{
                color: "#3B82F6",
                fillColor: "#3B82F6",
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationMarker}
              zIndexOffset={1000}
            >
              <Popup className="user-popup">
                <div className="p-1 text-center">
                  <p className="font-outfit font-semibold">You are here</p>
                  <p className="text-xs text-muted-foreground">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        {markers.map(({ post, marker, isFavorite: postIsFavorite }) => (
          <Marker
            key={post._id}
            position={[post.latitude, post.longitude]}
            icon={marker}
            eventHandlers={{
              click: () => onMarkerClick?.(post),
            }}
          >
            <Popup className="food-popup">
              <div className="min-w-[200px] p-1">
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="mb-2 h-24 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-outfit text-base font-semibold">{post.title}</h3>
                  {postIsFavorite && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-coral-500 to-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                      <Heart className="h-2.5 w-2.5 fill-current" />
                      Fave
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {post.locationName}
                </div>
                <div className="mt-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      post.timeRemaining <= 0
                        ? "bg-red-500/20 text-red-500"
                        : post.timeRemaining < 1800000
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-green-500/20 text-green-500"
                    }`}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {formatTimeRemaining(post.timeRemaining)}
                  </Badge>
                </div>
                {post.dietaryTags && post.dietaryTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.dietaryTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-coral-500/10 text-coral-600 text-xs"
                        title={dietaryTagConfig[tag].label}
                      >
                        <span className="mr-0.5">{dietaryTagConfig[tag].icon}</span>
                        <span>{dietaryTagConfig[tag].label}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map overlay gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
