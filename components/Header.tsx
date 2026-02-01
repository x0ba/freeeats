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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin, Plus, ChevronDown, Utensils, Bell, Flag, Check, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface HeaderProps {
  onAddFood: () => void;
  isAuthenticated: boolean;
}

export function Header({ onAddFood, isAuthenticated }: HeaderProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrent);
  const [campusSearchOpen, setCampusSearchOpen] = useState(false);
  const [campusSearchTerm, setCampusSearchTerm] = useState("");
  
  // Use search query for campus selection (supports 380+ campuses efficiently)
  const searchedCampuses = useQuery(
    api.campuses.search,
    campusSearchOpen ? { searchTerm: campusSearchTerm } : "skip"
  );
  const currentCampus = useQuery(
    api.campuses.get,
    currentUser?.campusId ? { campusId: currentUser.campusId } : "skip"
  );
  const setCampus = useMutation(api.users.setCampus);
  const getOrCreate = useMutation(api.users.getOrCreate);
  const notifications = useQuery(
    api.notifications.getForCurrentUser,
    isAuthenticated ? {} : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isAuthenticated ? {} : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

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
    setCampusSearchOpen(false);
    setCampusSearchTerm("");
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

        {/* Campus Selector - Searchable */}
        {isAuthenticated && currentUser && (
          <Popover open={campusSearchOpen} onOpenChange={setCampusSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={campusSearchOpen}
                className="gap-2 border-border/50 bg-secondary/50 hover:bg-secondary"
              >
                <MapPin className="h-4 w-4 text-coral-500" />
                <span className="max-w-[150px] truncate">
                  {currentCampus?.name ?? "Select Campus"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="center">
              <Command className="bg-transparent" shouldFilter={false}>
                <div className="relative border-b border-border/50">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <CommandInput
                    placeholder="Type your university name..."
                    value={campusSearchTerm}
                    onValueChange={setCampusSearchTerm}
                    className="border-0 pl-9"
                  />
                </div>
                <CommandList className="max-h-[300px]">
                  <CommandEmpty className="py-6 text-center">
                    {campusSearchTerm ? (
                      <div className="text-sm text-muted-foreground">
                        No universities found for &quot;{campusSearchTerm}&quot;
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Search 380+ universities</p>
                        <p className="text-xs text-muted-foreground">
                          Start typing to find your school
                        </p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchedCampuses?.map((campus) => (
                      <CommandItem
                        key={campus._id}
                        value={campus.name}
                        onSelect={() => handleCampusChange(campus._id)}
                        className={`cursor-pointer px-3 py-2 ${
                          currentUser?.campusId === campus._id
                            ? "bg-coral-500/10 text-coral-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`h-4 w-4 ${
                            currentUser?.campusId === campus._id
                              ? "text-coral-500"
                              : "text-muted-foreground"
                          }`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{campus.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {campus.city}, {campus.state}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    {(unreadCount ?? 0) > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-[10px] font-medium text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="font-medium">Notifications</span>
                    {(unreadCount ?? 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAllAsRead({})}
                        className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification._id}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead({ notificationId: notification._id });
                            }
                          }}
                          className={`flex cursor-pointer flex-col items-start gap-1 p-3 ${
                            !notification.isRead ? "bg-coral-500/5" : ""
                          }`}
                        >
                          <div className="flex w-full items-start gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                              <Flag className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {notification.foodTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notification.reportCount}{" "}
                                {notification.reportCount === 1 ? "person" : "people"}{" "}
                                reported this food is gone
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-coral-500" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

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
