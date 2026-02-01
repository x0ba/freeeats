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
type DietaryTag = "vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "dairy-free" | "nut-free" | "no-beef";

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

interface MarkerItem {
  post: FoodPost;
  marker: DivIcon;
  isFavorite: boolean;
  matchesDiet: boolean;
}

interface Cluster {
  posts: FoodPost[];
  center: { lat: number; lng: number };
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
  "no-beef": { icon: "🐄", label: "No Beef" },
};


// Paper note style marker with pushpin
function createFoodMarker(foodType: FoodType, isExpiringSoon: boolean, isFavorite: boolean, matchesDiet: boolean): DivIcon {
  const emoji = foodEmojis[foodType];
  const pulseClass = isExpiringSoon ? "animate-pulse" : "";

  // Colors based on status
  let borderColor = "#E8DCC5"; // Default cream border
  let pinColor = "#C4532E"; // Terracotta pin

  if (matchesDiet) {
    borderColor = "#2D5A4A"; // Forest green
    pinColor = "#2D5A4A";
  } else if (isFavorite) {
    borderColor = "#E8A838"; // Amber
    pinColor = "#E8A838";
  }

  const favoriteHeart = isFavorite
    ? `<div style="
        position: absolute;
        bottom: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #E8A838, #C98A20);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        border: 2px solid #FFFDF9;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        z-index: 10;
      ">❤️</div>`
    : "";

  const dietBadge = matchesDiet
    ? `<div style="
        position: absolute;
        bottom: -4px;
        left: -4px;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #2D5A4A, #1E4535);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        border: 2px solid #FFFDF9;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        z-index: 10;
        color: white;
      ">✓</div>`
    : "";

  return new DivIcon({
    html: `
      <div class="food-marker ${pulseClass}" style="
        position: relative;
        width: 44px;
        height: 52px;
      ">
        <!-- Pushpin -->
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, ${pinColor}, ${pinColor}dd);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3);
          border: 2px solid #FFFDF9;
          z-index: 11;
        "></div>
        <!-- Paper note -->
        <div style="
          position: absolute;
          top: 10px;
          left: 0;
          width: 44px;
          height: 42px;
          background: #FFFDF9;
          border: 2px solid ${borderColor};
          border-radius: 2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transform: rotate(-2deg);
        ">
          ${emoji}
          ${favoriteHeart}
          ${dietBadge}
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
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
          background: #2D5A4A;
          border-radius: 50%;
          border: 3px solid #FFFDF9;
          box-shadow: 0 2px 8px rgba(45, 90, 74, 0.5);
          animation: userPulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          width: 48px;
          height: 48px;
          background: rgba(45, 90, 74, 0.2);
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

// Calculate distance between two points in meters (Haversine formula approximation)
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Cluster nearby posts together
function clusterPosts(posts: FoodPost[], thresholdMeters: number = 50): { clusters: Cluster[]; singles: FoodPost[] } {
  const used = new Set<string>();
  const clusters: Cluster[] = [];
  const singles: FoodPost[] = [];

  for (const post of posts) {
    if (used.has(post._id)) continue;

    // Find all posts within threshold distance
    const nearby = posts.filter((p) => {
      if (p._id === post._id || used.has(p._id)) return false;
      const dist = getDistanceMeters(post.latitude, post.longitude, p.latitude, p.longitude);
      return dist <= thresholdMeters;
    });

    if (nearby.length > 0) {
      // Create a cluster with this post and all nearby posts
      const clusterPosts = [post, ...nearby];
      clusterPosts.forEach((p) => used.add(p._id));

      // Calculate cluster center (average of all positions)
      const centerLat = clusterPosts.reduce((sum, p) => sum + p.latitude, 0) / clusterPosts.length;
      const centerLng = clusterPosts.reduce((sum, p) => sum + p.longitude, 0) / clusterPosts.length;

      clusters.push({
        posts: clusterPosts,
        center: { lat: centerLat, lng: centerLng },
      });
    } else {
      used.add(post._id);
      singles.push(post);
    }
  }

  return { clusters, singles };
}

// Create cluster marker with count badge
function createClusterMarker(count: number, foodTypes: FoodType[]): DivIcon {
  // Get unique food emojis (up to 3)
  const uniqueTypes = [...new Set(foodTypes)].slice(0, 3);
  const emojis = uniqueTypes.map((type) => foodEmojis[type]).join("");

  return new DivIcon({
    html: `
      <div class="cluster-marker" style="
        position: relative;
        width: 52px;
        height: 60px;
      ">
        <!-- Pushpin -->
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #8B5A2B, #6B4423);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3);
          border: 2px solid #FFFDF9;
          z-index: 11;
        "></div>
        <!-- Stacked paper notes effect -->
        <div style="
          position: absolute;
          top: 14px;
          left: 4px;
          width: 44px;
          height: 42px;
          background: #F5F0E5;
          border: 2px solid #D4C4A8;
          border-radius: 2px;
          transform: rotate(3deg);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        "></div>
        <div style="
          position: absolute;
          top: 12px;
          left: 2px;
          width: 44px;
          height: 42px;
          background: #FAF7F0;
          border: 2px solid #E0D4C0;
          border-radius: 2px;
          transform: rotate(-1deg);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        "></div>
        <!-- Main paper note -->
        <div style="
          position: absolute;
          top: 10px;
          left: 0;
          width: 52px;
          height: 46px;
          background: #FFFDF9;
          border: 2px solid #E8DCC5;
          border-radius: 2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transform: rotate(-2deg);
        ">
          ${emojis}
        </div>
        <!-- Count badge -->
        <div style="
          position: absolute;
          top: 4px;
          right: -4px;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #C4532E, #A3421F);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          border: 2px solid #FFFDF9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 12;
          font-family: system-ui, -apple-system, sans-serif;
        ">${count}</div>
      </div>
    `,
    iconSize: [52, 60],
    iconAnchor: [26, 60],
    popupAnchor: [0, -56],
    className: "cluster-marker-container",
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
  const dietaryRestrictions = useQuery(api.users.getDietaryRestrictions);

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

  // Cluster posts and prepare markers
  const { clusters, singleMarkers } = useMemo(() => {
    const { clusters, singles } = clusterPosts(posts, 50);

    // Create markers for single (non-clustered) posts
    const singleMarkers: MarkerItem[] = singles.map((post) => {
      const isExpiringSoon = post.timeRemaining < 1800000; // 30 minutes
      const postIsFavorite = isFavorite(post.foodType);

      let matchesDiet = false;
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        matchesDiet = dietaryRestrictions.every(tag => post.dietaryTags && post.dietaryTags.includes(tag as DietaryTag));
      }

      const marker = createFoodMarker(post.foodType, isExpiringSoon, postIsFavorite, matchesDiet);
      return { post, marker, isFavorite: postIsFavorite, matchesDiet };
    });

    return { clusters, singleMarkers };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, cuisinePreferences, dietaryRestrictions]);

  const userLocationMarker = useMemo(() => createUserLocationMarker(), []);

  // Tile layer URLs for light/dark modes (CartoDB Positron/Dark Matter)
  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: isDarkMode ? "#1F1A13" : "#FFF8F0" }}
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
                color: "#2D5A4A",
                fillColor: "#2D5A4A",
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
                  <p className="font-display font-semibold">You are here</p>
                  <p className="text-xs text-muted-foreground">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Cluster markers */}
        {clusters.map((cluster, index) => {
          const foodTypes = cluster.posts.map(p => p.foodType);
          const clusterIcon = createClusterMarker(cluster.posts.length, foodTypes);
          
          return (
            <Marker
              key={`cluster-${index}`}
              position={[cluster.center.lat, cluster.center.lng]}
              icon={clusterIcon}
            >
              <Popup className="cluster-popup">
                <div className="min-w-[220px] max-h-[250px] overflow-y-auto">
                  <div className="sticky top-0 bg-background py-1 mb-2 border-b border-border">
                    <span className="font-display font-semibold text-sm">
                      {cluster.posts.length} items nearby
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cluster.posts.map((post) => {
                      const isExpiringSoon = post.timeRemaining < 1800000;
                      return (
                        <button
                          key={post._id}
                          onClick={() => onMarkerClick?.(post)}
                          className="w-full text-left p-2 rounded-sm border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg shrink-0">{foodEmojis[post.foodType]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{post.title}</p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                {post.locationName}
                              </p>
                              <Badge
                                className={`mt-1 text-[10px] px-1.5 py-0 rounded-sm border ${
                                  post.timeRemaining <= 0
                                    ? "bg-destructive/90 text-white border-destructive"
                                    : isExpiringSoon
                                      ? "bg-amber-500 text-charcoal-900 border-amber-600"
                                      : "bg-forest-500 text-white border-forest-600"
                                }`}
                              >
                                <Clock className="mr-0.5 h-2.5 w-2.5" />
                                {formatTimeRemaining(post.timeRemaining)}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Single (non-clustered) markers */}
        {singleMarkers.map(({ post, marker, isFavorite: postIsFavorite, matchesDiet }) => (
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
                    className="mb-2 h-24 w-full rounded-sm object-cover border border-border"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold">{post.title}</h3>
                  <div className="flex flex-col gap-1 items-end">
                    {matchesDiet && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-forest-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        ✓ Match
                      </span>
                    )}
                    {postIsFavorite && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-charcoal-900">
                        <Heart className="h-2.5 w-2.5 fill-current" />
                        Fave
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {post.locationName}
                </div>
                <div className="mt-2">
                  <Badge
                    className={`text-xs rounded-sm border ${
                      post.timeRemaining <= 0
                        ? "bg-destructive/90 text-white border-destructive"
                        : post.timeRemaining < 1800000
                          ? "bg-amber-500 text-charcoal-900 border-amber-600"
                          : "bg-forest-500 text-white border-forest-600"
                    }`}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {formatTimeRemaining(post.timeRemaining)}
                  </Badge>
                </div>
                {post.dietaryTags && post.dietaryTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.dietaryTags.map((tag) => {
                      const config = dietaryTagConfig[tag as DietaryTag];
                      if (!config) return null;
                      return (
                        <Badge
                          key={tag}
                          className="bg-secondary text-secondary-foreground text-xs rounded-sm border border-border"
                          title={config.label}
                        >
                          <span className="mr-0.5">{config.icon}</span>
                          <span>{config.label}</span>
                        </Badge>
                      );
                    })}
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
