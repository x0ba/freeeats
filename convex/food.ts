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
          createdBy: post.createdBy,
          imageUrl,
          timeRemaining: post.expiresAt - now,
          goneReports: post.goneReports ?? 0,
          reportedBy: post.reportedBy ?? [],
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

// Mark food as gone (only the creator can delete)
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

    // Only the creator can delete the food post
    if (post.createdBy !== user._id) {
      throw new Error("Only the creator can delete this food post");
    }

    await ctx.db.patch(args.postId, {
      isActive: false,
      markedGoneBy: user._id,
    });

    return { success: true };
  },
});

// Report that food is gone (for non-creators)
export const reportGone = mutation({
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

    // Creators should use markGone instead
    if (post.createdBy === user._id) {
      throw new Error("As the creator, use the delete option instead");
    }

    // Check if this user has already reported this post
    const reportedBy = post.reportedBy ?? [];
    if (reportedBy.includes(user._id)) {
      throw new Error("You have already reported this food post");
    }

    // Increment the report counter and add user to reportedBy list
    const newReportCount = reportedBy.length + 1;
    await ctx.db.patch(args.postId, {
      goneReports: newReportCount,
      reportedBy: [...reportedBy, user._id],
    });

    // Notify the creator that someone reported their food is gone
    // Check if there's already a notification for this food post
    const existingNotification = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", post.createdBy).eq("foodPostId", args.postId)
      )
      .first();

    if (existingNotification) {
      // Update the existing notification with new report count and mark as unread
      await ctx.db.patch(existingNotification._id, {
        reportCount: newReportCount,
        isRead: false,
      });
    } else {
      // Create a new notification
      await ctx.db.insert("notifications", {
        userId: post.createdBy,
        type: "food_reported_gone",
        foodPostId: args.postId,
        foodTitle: post.title,
        reportCount: newReportCount,
        isRead: false,
      });
    }

    return { success: true, reportCount: newReportCount };
  },
});

// Undo a report (for users who reported by mistake)
export const unreportGone = mutation({
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

    // Check if this user has actually reported this post
    const reportedBy = post.reportedBy ?? [];
    if (!reportedBy.includes(user._id)) {
      throw new Error("You haven't reported this food post");
    }

    // Remove the user from the reportedBy list and decrement counter
    const newReportedBy = reportedBy.filter((id) => id !== user._id);
    const newReportCount = newReportedBy.length;
    await ctx.db.patch(args.postId, {
      goneReports: newReportCount,
      reportedBy: newReportedBy,
    });

    // Update the notification if it exists
    const existingNotification = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", post.createdBy).eq("foodPostId", args.postId)
      )
      .first();

    if (existingNotification) {
      if (newReportCount === 0) {
        // Delete the notification if no more reports
        await ctx.db.delete(existingNotification._id);
      } else {
        // Update the report count
        await ctx.db.patch(existingNotification._id, {
          reportCount: newReportCount,
        });
      }
    }

    return { success: true, reportCount: newReportCount };
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
