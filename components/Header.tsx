"use client";

import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Plus, ChevronDown, Utensils } from "lucide-react";
import { useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface HeaderProps {
  onAddFood: () => void;
  isAuthenticated: boolean;
}

export function Header({ onAddFood, isAuthenticated }: HeaderProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrent);
  const campuses = useQuery(api.campuses.list, {});
  const currentCampus = useQuery(
    api.campuses.get,
    currentUser?.campusId ? { campusId: currentUser.campusId } : "skip"
  );
  const setCampus = useMutation(api.users.setCampus);
  const getOrCreate = useMutation(api.users.getOrCreate);

  // Sync Clerk user to Convex on load
  useEffect(() => {
    if (clerkUser && isLoaded) {
      void getOrCreate({
        clerkId: clerkUser.id,
        name: clerkUser.fullName ?? clerkUser.firstName ?? "Anonymous",
        email: clerkUser.primaryEmailAddress?.emailAddress,
        imageUrl: clerkUser.imageUrl,
      });
    }
  }, [clerkUser, isLoaded, getOrCreate]);

  const handleCampusChange = async (campusId: Id<"campuses">) => {
    await setCampus({ campusId });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-lg shadow-coral-500/25">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <span className="font-outfit text-xl font-bold tracking-tight">
            Free<span className="text-coral-500">Eats</span>
          </span>
        </div>

        {/* Campus Selector */}
        {isAuthenticated && currentUser && campuses && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-border/50 bg-secondary/50 hover:bg-secondary"
              >
                <MapPin className="h-4 w-4 text-coral-500" />
                <span className="max-w-[150px] truncate">
                  {currentCampus?.name ?? "Select Campus"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="max-h-80 overflow-auto">
              {campuses.map((campus) => (
                <DropdownMenuItem
                  key={campus._id}
                  onClick={() => handleCampusChange(campus._id)}
                  className="cursor-pointer"
                >
                  {campus.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button
                onClick={onAddFood}
                className="gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-500/25 hover:from-coral-600 hover:to-coral-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Food</span>
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </>
          ) : (
            <div className="flex gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-gradient-to-r from-coral-500 to-coral-600 text-white">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
