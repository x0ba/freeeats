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
import { Map, List, Users, Zap, MapPin } from "lucide-react";

// Dynamic import for map to avoid SSR issues with Leaflet
const FoodMap = dynamic(() => import("@/components/FoodMap").then((mod) => mod.FoodMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-secondary">
      <div className="text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-sm" />
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-sm bg-primary/20" />
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
      <div className="border-b-2 border-border bg-card">
        <div className="flex gap-1 px-4 py-2 sm:px-6">
          <Button
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
            className={`gap-2 rounded-sm ${view === "map" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Map className="h-4 w-4" />
            Map
          </Button>
          <Button
            variant={view === "feed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("feed")}
            className={`gap-2 rounded-sm ${view === "feed" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <List className="h-4 w-4" />
            Feed
            {foodPosts && foodPosts.length > 0 && (
              <span className={`ml-1 rounded-sm px-1.5 py-0.5 text-xs ${
                view === "feed" ? "bg-primary-foreground/20" : "bg-muted"
              }`}>
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
    <div className="min-h-screen bg-background cork-texture">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          {/* Illustrated food icon */}
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-primary/10 rotate-3" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary paper-shadow">
              <span className="text-xl">🍕</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight leading-none">
              Free<span className="text-primary">Eats</span>
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide">CAMPUS FOOD FINDER</span>
          </div>
        </div>
        <div className="flex gap-2">
          <SignInButton mode="modal">
            <Button variant="ghost" className="rounded-sm">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="bg-primary text-primary-foreground shadow-md rounded-sm">
              Get Started
            </Button>
          </SignUpButton>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Decorative note card badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-sm border-2 border-primary/30 bg-card px-4 py-2 text-sm text-primary paper-shadow paper-rotate-1">
            <span className="text-lg">📌</span>
            Never miss free food on campus
          </div>

          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">
            Find{" "}
            <span className="wavy-underline text-primary">Free Food</span>
            <br />
            on Campus
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Students share free food from club events, career fairs, and more.
            Get notified when there&apos;s free pizza near you!
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignUpButton mode="modal">
              <Button
                size="xl"
                className="relative gap-2 bg-primary text-primary-foreground px-8 font-medium shadow-lg rounded-sm"
              >
                {/* Pushpin decoration */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border-2 border-amber-300" />
                <span className="text-xl">🍕</span>
                Start Finding Food
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Feature Cards - Bulletin Board Style */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 sm:grid-cols-3">
          {/* Card 1 - Pinned */}
          <div className="relative rounded-sm border-2 border-border bg-card p-6 paper-shadow paper-rotate-1">
            {/* Pushpin */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-terracotta-700 shadow-md border-2 border-primary-foreground z-10" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 border border-primary/20">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold">Live Map</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See free food locations on an interactive map of your campus in real-time
            </p>
          </div>

          {/* Card 2 - Taped */}
          <div className="relative rounded-sm border-2 border-border bg-card p-6 paper-shadow paper-rotate-2 sm:mt-8">
            {/* Tape decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-amber-100/80 dark:bg-amber-900/30 rounded-sm rotate-2 shadow-sm" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-forest-500/10 border border-forest-500/20">
              <Users className="h-6 w-6 text-forest-500" />
            </div>
            <h3 className="font-display text-lg font-bold">Community</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Students help students by sharing what they find around campus
            </p>
          </div>

          {/* Card 3 - Pinned */}
          <div className="relative rounded-sm border-2 border-border bg-card p-6 paper-shadow paper-rotate-3 sm:mt-4">
            {/* Pushpin */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-md border-2 border-amber-300 z-10" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-amber-500/10 border border-amber-500/20">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-display text-lg font-bold">Real-time</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Updates instantly when food is posted or runs out - never arrive too late
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mx-auto mt-32 max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold mb-12">
            How it works
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-card border-2 border-border paper-shadow">
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-lg font-bold">Select your campus</h3>
                  <p className="text-muted-foreground">Choose from 380+ universities across the US</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-card border-2 border-border paper-shadow">
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest-500 text-white text-sm font-bold">2</span>
                  <span className="text-3xl">👀</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-lg font-bold">Browse the board</h3>
                  <p className="text-muted-foreground">See what free food is available right now near you</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-card border-2 border-border paper-shadow">
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-charcoal-900 text-sm font-bold">3</span>
                  <span className="text-3xl">📌</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-lg font-bold">Pin your finds</h3>
                  <p className="text-muted-foreground">Found free food? Share it with your fellow students!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8 text-center text-sm text-muted-foreground bg-card">
        <div className="container mx-auto">
          <p>Made with 🍕 for hungry students everywhere</p>
        </div>
      </footer>
    </div>
  );
}
