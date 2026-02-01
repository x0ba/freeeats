"use client";

import { UserButton, SignInButton, SignUpButton, useUser, useClerk } from "@clerk/nextjs";
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
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MapPin, Plus, ChevronDown, Utensils, Bell, Flag, Check, Search, Trash2, AlertTriangle, Loader2, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { CuisinePreferencesEditor, CuisinePreferences } from "./CuisinePreferences";
import { DietaryRestrictionsSelector, DietaryTag } from "./DietaryRestrictionsSelector";

interface HeaderProps {
  onAddFood: () => void;
  isAuthenticated: boolean;
}

export function Header({ onAddFood, isAuthenticated }: HeaderProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const currentUser = useQuery(api.users.getCurrent);
  const [campusSearchOpen, setCampusSearchOpen] = useState(false);
  const [campusSearchTerm, setCampusSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const prevCampusesRef = useRef<typeof searchedCampuses>(undefined);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const cuisinePreferences = useQuery(api.users.getCuisinePreferences, isAuthenticated ? {} : "skip");
  const setCuisinePreferences = useMutation(api.users.setCuisinePreferences);
  const dietaryRestrictions = useQuery(api.users.getDietaryRestrictions, isAuthenticated ? {} : "skip");
  const setDietaryRestrictions = useMutation(api.users.setDietaryRestrictions);
  
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

  // Anti-flashing: track when search is in progress
  useEffect(() => {
    if (campusSearchTerm) {
      setIsSearching(true);
    }
  }, [campusSearchTerm]);

  // Anti-flashing: preserve previous results and clear searching state
  useEffect(() => {
    if (searchedCampuses !== undefined) {
      setIsSearching(false);
      prevCampusesRef.current = searchedCampuses;
    }
  }, [searchedCampuses]);

  const displayCampuses = searchedCampuses ?? prevCampusesRef.current;

  const handleCampusChange = async (campusId: Id<"campuses">) => {
    await setCampus({ campusId });
    setCampusSearchOpen(false);
    setCampusSearchTerm("");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount({});
      toast.success("Account deleted successfully");
      // Sign out from Clerk after deleting Convex data
      await signOut();
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSavePreferences = async (preferences: CuisinePreferences) => {
    try {
      await setCuisinePreferences({ preferences });
      toast.success("Cuisine preferences updated!");
      // Don't close dialog yet - let user update diet too if they want
    } catch (error) {
      console.error("Failed to save cuisine preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  const handleSaveDietaryRestrictions = async (restrictions: DietaryTag[]) => {
    try {
      await setDietaryRestrictions({ dietaryRestrictions: restrictions });
      toast.success("Dietary restrictions updated!");
    } catch (error) {
      console.error("Failed to save dietary restrictions:", error);
      toast.error("Failed to save dietary restrictions. Please try again.");
    }
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
                    {!isSearching && (
                      campusSearchTerm ? (
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
                      )
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {displayCampuses?.map((campus) => (
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
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Food Preferences"
                    labelIcon={<Star className="h-4 w-4" />}
                    onClick={() => setPreferencesDialogOpen(true)}
                  />
                  <UserButton.Action
                    label="Delete Account"
                    labelIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setDeleteDialogOpen(true)}
                  />
                </UserButton.MenuItems>
              </UserButton>

              {/* Food Preferences Dialog */}
              <ResponsiveDialog open={preferencesDialogOpen} onOpenChange={setPreferencesDialogOpen}>
                <ResponsiveDialogContent className="sm:max-w-2xl">
                  <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>Food Preferences</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                      Customize your feed and dietary requirements
                    </ResponsiveDialogDescription>
                  </ResponsiveDialogHeader>

                  <Tabs defaultValue="cuisine" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="cuisine">Cuisines</TabsTrigger>
                      <TabsTrigger value="dietary">Dietary</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="cuisine">
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto p-2">
                        <div className="text-sm text-muted-foreground">
                          Rate cuisines to see your favorites first in the feed.
                        </div>
                        <CuisinePreferencesEditor
                          initialPreferences={cuisinePreferences as CuisinePreferences | null}
                          onSave={handleSavePreferences}
                          submitLabel="Save Preferences"
                          isCompact={true}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="dietary">
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto p-2">
                        <div className="text-sm text-muted-foreground">
                           Select any restrictions to highlight matching foods.
                        </div>
                        <DietaryRestrictionsSelector
                          initialRestrictions={dietaryRestrictions}
                          onSave={handleSaveDietaryRestrictions}
                          submitLabel="Save Restrictions"
                          isCompact={true}
                          // For preferences modal, we don't want to skip, just save
                          showSkip={false} 
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-2 flex justify-end border-t border-border/50 pt-4">
                    <Button variant="outline" onClick={() => setPreferencesDialogOpen(false)}>
                      Done
                    </Button>
                  </div>
                </ResponsiveDialogContent>
              </ResponsiveDialog>

              {/* Delete Account Confirmation Dialog */}
              <ResponsiveDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <ResponsiveDialogContent className="sm:max-w-md">
                  <ResponsiveDialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <ResponsiveDialogTitle className="text-center">Delete Account</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription className="text-center">
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data including:
                    </ResponsiveDialogDescription>
                  </ResponsiveDialogHeader>
                  <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      All your food posts
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      Your profile information
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      All your notifications
                    </p>
                  </div>
                  <ResponsiveDialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </ResponsiveDialogFooter>
                </ResponsiveDialogContent>
              </ResponsiveDialog>
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
