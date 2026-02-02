import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get or create a user profile from Clerk data
export const getOrCreate = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) {
      // Update user info if changed
      if (
        existing.name !== args.name ||
        existing.email !== args.email ||
        existing.imageUrl !== args.imageUrl
      ) {
        await ctx.db.patch(existing._id, {
          name: args.name,
          email: args.email,
          imageUrl: args.imageUrl,
        });
      }
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
    });
  },
});

// Get current user profile
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Include campus info if set
    if (user.campusId) {
      const campus = await ctx.db.get(user.campusId);
      return { ...user, campus };
    }

    return user;
  },
});

// Set user's selected campus
export const setCampus = mutation({
  args: {
    campusId: v.id("campuses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { campusId: args.campusId });
    return { success: true };
  },
});

// Get user by ID (for displaying post creators)
export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Delete user account and all associated data
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // 1. Delete all food posts created by this user (and their images)
    const userPosts = await ctx.db
      .query("foodPosts")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    for (const post of userPosts) {
      // Delete associated image from storage if exists
      if (post.imageId) {
        await ctx.storage.delete(post.imageId);
      }
      await ctx.db.delete(post._id);
    }

    // 2. Delete all notifications for this user
    const userNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const notification of userNotifications) {
      await ctx.db.delete(notification._id);
    }

    // 3. Delete all reviews by this user
    const userReviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const review of userReviews) {
      await ctx.db.delete(review._id);
    }

    // 5. Remove user from reportedBy arrays on other posts
    const allPosts = await ctx.db.query("foodPosts").collect();
    for (const post of allPosts) {
      if (post.reportedBy && post.reportedBy.includes(user._id)) {
        const newReportedBy = post.reportedBy.filter((id) => id !== user._id);
        await ctx.db.patch(post._id, {
          reportedBy: newReportedBy,
          goneReports: newReportedBy.length,
        });
      }
    }

    // 6. Delete the user record
    await ctx.db.delete(user._id);

    return { success: true };
  },
});

// Cuisine preference validator
const cuisinePreferencesValidator = v.object({
  pizza: v.optional(v.number()),
  sandwiches: v.optional(v.number()),
  snacks: v.optional(v.number()),
  drinks: v.optional(v.number()),
  desserts: v.optional(v.number()),
  asian: v.optional(v.number()),
  mexican: v.optional(v.number()),
  other: v.optional(v.number()),
});

// Dietary restriction validator
const dietaryTagValidator = v.union(
  v.literal("vegetarian"),
  v.literal("vegan"),
  v.literal("halal"),
  v.literal("kosher"),
  v.literal("gluten-free"),
  v.literal("dairy-free"),
  v.literal("nut-free"),
  v.literal("no-beef")
);

// Set user's cuisine preferences (used during signup and in settings)
export const setCuisinePreferences = mutation({
  args: {
    preferences: cuisinePreferencesValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      cuisinePreferences: args.preferences,
    });

    return { success: true };
  },
});

// Get user's cuisine preferences
export const getCuisinePreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    return user.cuisinePreferences ?? null;
  },
});

// Complete onboarding (after campus, cuisine preferences, and dietary restrictions are set)
export const completeOnboarding = mutation({
  args: {
    campusId: v.id("campuses"),
    preferences: cuisinePreferencesValidator,
    dietaryRestrictions: v.optional(v.array(dietaryTagValidator)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      campusId: args.campusId,
      cuisinePreferences: args.preferences,
      dietaryRestrictions: args.dietaryRestrictions,
      hasCompletedOnboarding: true,
    });

    return { success: true };
  },
});

// Get user's dietary restrictions
export const getDietaryRestrictions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    return user.dietaryRestrictions ?? null;
  },
});

// Set user's dietary restrictions (used in settings)
export const setDietaryRestrictions = mutation({
  args: {
    dietaryRestrictions: v.array(dietaryTagValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      dietaryRestrictions: args.dietaryRestrictions,
    });

    return { success: true };
  },
});
