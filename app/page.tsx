"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/Header";
import { FoodFeed } from "@/components/FoodFeed";
import { CampusSelector } from "@/components/CampusSelector";
import { AddFoodDialog } from "@/components/AddFoodDialog";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, List, Utensils, Pizza, Users, Sparkles } from "lucide-react";

// Dynamic import for map to avoid SSR issues with Leaflet
const FoodMap = dynamic(() => import("@/components/FoodMap").then((mod) => mod.FoodMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-secondary/30">
      <div className="text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-32" />
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}

function AuthenticatedApp() {
  const [view, setView] = useState<"map" | "feed">("map");
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const currentUser = useQuery(api.users.getCurrent);
  const campus = useQuery(
    api.campuses.get,
    currentUser?.campusId ? { campusId: currentUser.campusId } : "skip"
  );
  const foodPosts = useQuery(
    api.food.listByCampus,
    currentUser?.campusId ? { campusId: currentUser.campusId } : "skip"
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state
  if (currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-xl bg-coral-500/20" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show campus selector if user hasn't selected one
  if (currentUser && !currentUser.campusId) {
    return <CampusSelector onCampusSelected={() => {}} />;
  }

  const campusCenter: [number, number] = campus
    ? [campus.latitude, campus.longitude]
    : [37.8719, -122.2585]; // Default to Berkeley

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onAddFood={() => setAddFoodOpen(true)} isAuthenticated={true} />

      {/* View Toggle */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-1 px-4 py-2 sm:px-6">
          <Button
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
            className={`gap-2 ${view === "map" ? "bg-coral-500 text-white hover:bg-coral-600" : ""}`}
          >
            <Map className="h-4 w-4" />
            Map
          </Button>
          <Button
            variant={view === "feed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("feed")}
            className={`gap-2 ${view === "feed" ? "bg-coral-500 text-white hover:bg-coral-600" : ""}`}
          >
            <List className="h-4 w-4" />
            Feed
            {foodPosts && foodPosts.length > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {foodPosts.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {view === "map" ? (
          <div className="h-[calc(100vh-8rem)]">
            {isMounted && (
              <FoodMap
                posts={foodPosts ?? []}
                center={campusCenter}
                zoom={16}
                className="h-full w-full"
              />
            )}
          </div>
        ) : (
          <FoodFeed campusId={currentUser!.campusId!} />
        )}
      </main>

      {/* Add Food Dialog */}
      {currentUser?.campusId && (
        <AddFoodDialog
          open={addFoodOpen}
          onOpenChange={setAddFoodOpen}
          campusId={currentUser.campusId}
          campusCenter={campusCenter}
        />
      )}
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-coral-500/5">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-lg shadow-coral-500/25">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <span className="font-outfit text-2xl font-bold tracking-tight">
            Free<span className="text-coral-500">Eats</span>
          </span>
        </div>
        <div className="flex gap-2">
          <SignInButton mode="modal">
            <Button variant="ghost">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-500/25">
              Get Started
            </Button>
          </SignUpButton>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-coral-500/20 bg-coral-500/10 px-4 py-2 text-sm text-coral-500">
            <Sparkles className="h-4 w-4" />
            Never miss free food on campus
          </div>
          
          <h1 className="font-outfit text-5xl font-bold tracking-tight sm:text-7xl">
            Find{" "}
            <span className="bg-gradient-to-r from-coral-500 to-coral-600 bg-clip-text text-transparent">
              Free Food
            </span>
            <br />
            on Campus
          </h1>
          
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Students share free food from club events, career fairs, and more.
            Get notified when there&apos;s free pizza near you! 🍕
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="h-14 gap-2 bg-gradient-to-r from-coral-500 to-coral-600 px-8 text-lg font-medium text-white shadow-xl shadow-coral-500/30 transition-all hover:from-coral-600 hover:to-coral-700 hover:shadow-2xl hover:shadow-coral-500/40"
              >
                <Pizza className="h-5 w-5" />
                Start Finding Food
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-coral-500/10">
              <Map className="h-6 w-6 text-coral-500" />
            </div>
            <h3 className="font-outfit text-lg font-semibold">Live Map</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See free food locations on an interactive map of your campus
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-coral-500/10">
              <Users className="h-6 w-6 text-coral-500" />
            </div>
            <h3 className="font-outfit text-lg font-semibold">Community</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Students help students by sharing what they find
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-coral-500/10">
              <Sparkles className="h-6 w-6 text-coral-500" />
            </div>
            <h3 className="font-outfit text-lg font-semibold">Real-time</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Updates instantly when food is posted or runs out
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        Made with 🍕 for hungry students everywhere
      </footer>
    </div>
  );
}
