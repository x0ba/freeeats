import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const foodTypeValidator = v.union(
  v.literal("pizza"),
  v.literal("sandwiches"),
  v.literal("snacks"),
  v.literal("drinks"),
  v.literal("desserts"),
  v.literal("asian"),
  v.literal("mexican"),
  v.literal("other")
);

// Create a new food post
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    foodType: foodTypeValidator,
    campusId: v.id("campuses"),
    locationName: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    durationMinutes: v.number(),
    imageId: v.optional(v.id("_storage")),
    dietaryTags: v.optional(v.array(v.union(
      v.literal("vegetarian"),
      v.literal("vegan"),
      v.literal("halal"),
      v.literal("kosher"),
      v.literal("gluten-free"),
      v.literal("dairy-free"),
      v.literal("nut-free")
    ))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const expiresAt = Date.now() + args.durationMinutes * 60 * 1000;

    const postId = await ctx.db.insert("foodPosts", {
      title: args.title,
      description: args.description,
      foodType: args.foodType,
      campusId: args.campusId,
      locationName: args.locationName,
      latitude: args.latitude,
      longitude: args.longitude,
      expiresAt,
      imageId: args.imageId,
      createdBy: user._id,
      isActive: true,
      dietaryTags: args.dietaryTags,
    });

    return postId;
  },
});

// Get active food posts for a campus
export const listByCampus = query({
  args: {
    campusId: v.id("campuses"),
    includeExpired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const posts = await ctx.db
      .query("foodPosts")
      .withIndex("by_campus", (q) =>
        q.eq("campusId", args.campusId).eq("isActive", true)
      )
      .collect();

    // Filter out expired posts unless requested
    const activePosts = args.includeExpired
      ? posts
      : posts.filter((p) => p.expiresAt > now);

    // Enrich with creator info and image URLs
    const enrichedPosts = await Promise.all(
      activePosts.map(async (post) => {
        const creator = await ctx.db.get(post.createdBy);
        const imageUrl = post.imageId
          ? await ctx.storage.getUrl(post.imageId)
          : null;

        return {
          ...post,
          creator: creator
            ? { name: creator.name, imageUrl: creator.imageUrl }
            : null,
          imageUrl,
          timeRemaining: post.expiresAt - now,
        };
      })
    );

    // Sort by creation time (newest first)
    return enrichedPosts.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Get a single food post
export const get = query({
  args: {
    postId: v.id("foodPosts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const creator = await ctx.db.get(post.createdBy);
    const imageUrl = post.imageId
      ? await ctx.storage.getUrl(post.imageId)
      : null;

    return {
      ...post,
      creator: creator
        ? { name: creator.name, imageUrl: creator.imageUrl }
        : null,
      imageUrl,
      timeRemaining: post.expiresAt - Date.now(),
    };
  },
});

// Mark food as gone
export const markGone = mutation({
  args: {
    postId: v.id("foodPosts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.postId, {
      isActive: false,
      markedGoneBy: user._id,
    });

    return { success: true };
  },
});

// Get posts created by current user
export const getMyPosts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const posts = await ctx.db
      .query("foodPosts")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    return posts.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Generate upload URL for food images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});
