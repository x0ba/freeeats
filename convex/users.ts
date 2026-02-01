import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get or create a user profile from Clerk data
export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
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
      clerkId: args.clerkId,
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
