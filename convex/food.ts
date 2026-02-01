import { v } from "convex/values";
import { query, mutation, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

const dietaryTagsValidator = v.optional(v.array(v.union(
  v.literal("vegetarian"),
  v.literal("vegan"),
  v.literal("halal"),
  v.literal("kosher"),
  v.literal("gluten-free"),
  v.literal("dairy-free"),
  v.literal("nut-free"),
  v.literal("no-beef")
)));

// Internal mutation to create a food post (called after moderation)
export const createInternal = internalMutation({
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
    dietaryTags: dietaryTagsValidator,
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
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

// Public action to create a food post with AI moderation
export const create = action({
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
    dietaryTags: dietaryTagsValidator,
  },
  returns: v.id("foodPosts"),
  handler: async (ctx, args): Promise<Id<"foodPosts">> => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get image URL if present for moderation
    let imageUrl: string | undefined;
    if (args.imageId) {
      imageUrl = await ctx.storage.getUrl(args.imageId) ?? undefined;
    }

    // Run spam filter moderation
    const moderationResult = await ctx.runAction(internal.spamFilter.moderateContent, {
      title: args.title,
      description: args.description,
      imageUrl,
    });

    if (!moderationResult.isValid) {
      throw new Error(
        moderationResult.reason ||
          "This post doesn't appear to be about food. Please share food-related content only."
      );
    }

    // Create the post via internal mutation
    const postId: Id<"foodPosts"> = await ctx.runMutation(internal.food.createInternal, {
      title: args.title,
      description: args.description,
      foodType: args.foodType,
      campusId: args.campusId,
      locationName: args.locationName,
      latitude: args.latitude,
      longitude: args.longitude,
      durationMinutes: args.durationMinutes,
      imageId: args.imageId,
      dietaryTags: args.dietaryTags,
      clerkId: identity.subject,
    });

    return postId;
  },
});

// Get active food posts for a campus (sorted by user's cuisine preferences)
export const listByCampus = query({
  args: {
    campusId: v.id("campuses"),
    includeExpired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get current user's cuisine preferences if logged in
    let userPreferences: Record<string, number> | null = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      if (user?.cuisinePreferences) {
        userPreferences = user.cuisinePreferences as Record<string, number>;
      }
    }

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

    // Get review stats for each post
    const postReviewStats = new Map<string, { avg: number; count: number }>();
    for (const post of activePosts) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_food_post", (q) => q.eq("foodPostId", post._id))
        .collect();
      
      if (reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        postReviewStats.set(post._id, { avg, count: reviews.length });
      } else {
        postReviewStats.set(post._id, { avg: 0, count: 0 });
      }
    }

    // Enrich with creator info and image URLs
    const enrichedPosts = await Promise.all(
      activePosts.map(async (post) => {
        const creator = await ctx.db.get(post.createdBy);
        const imageUrl = post.imageId
          ? await ctx.storage.getUrl(post.imageId)
          : null;
        
        const stats = postReviewStats.get(post._id) ?? { avg: 0, count: 0 };

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
          averageRating: Math.round(stats.avg * 10) / 10,
          reviewCount: stats.count,
        };
      })
    );

    // Sort posts with new priority:
    // 1. Rating difference >= 1 star: higher rated food first
    // 2. Rating difference < 1 star: use user's cuisine preference
    // 3. Otherwise: sort by creation time (newest first)
    // NOTE: Posts with no reviews are treated as 2.5 stars for sorting purposes
    return enrichedPosts.sort((a, b) => {
      // Treat unrated posts (0 reviews) as 2.5 stars for sorting
      const ratingA = (a.reviewCount ?? 0) > 0 ? (a.averageRating ?? 2.5) : 2.5;
      const ratingB = (b.reviewCount ?? 0) > 0 ? (b.averageRating ?? 2.5) : 2.5;
      const ratingDiff = Math.abs(ratingA - ratingB);
      
      // Priority 1: If rating difference is >= 1 star, higher rating wins
      if (ratingDiff >= 1) {
        return ratingB - ratingA; // Higher rating first
      }
      
      // Priority 2: If rating difference < 1 star, use cuisine preference
      if (userPreferences) {
        const prefA = userPreferences[a.foodType] ?? 3; // Default to middle rating
        const prefB = userPreferences[b.foodType] ?? 3;
        
        if (prefA !== prefB) {
          return prefB - prefA; // Higher preference first
        }
      }
      
      // Priority 3: Tiebreaker - newer posts first
      return b._creationTime - a._creationTime;
    });
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

// Update a food post (only the creator can update)
export const update = mutation({
  args: {
    postId: v.id("foodPosts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    foodType: v.optional(foodTypeValidator),
    locationName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    imageId: v.optional(v.id("_storage")),
    dietaryTags: dietaryTagsValidator,
    extendMinutes: v.optional(v.number()), // Extend expiration time
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

    // Only the creator can update the food post
    if (post.createdBy !== user._id) {
      throw new Error("Only the creator can update this food post");
    }

    // Build the update object with only provided fields
    const updates: Record<string, unknown> = {};
    
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.foodType !== undefined) updates.foodType = args.foodType;
    if (args.locationName !== undefined) updates.locationName = args.locationName;
    if (args.latitude !== undefined) updates.latitude = args.latitude;
    if (args.longitude !== undefined) updates.longitude = args.longitude;
    if (args.dietaryTags !== undefined) updates.dietaryTags = args.dietaryTags;
    
    // Handle image update
    if (args.imageId !== undefined) {
      // Delete old image if it exists and is different
      if (post.imageId && post.imageId !== args.imageId) {
        await ctx.storage.delete(post.imageId);
      }
      updates.imageId = args.imageId;
    }
    
    // Extend expiration time if requested
    if (args.extendMinutes !== undefined && args.extendMinutes > 0) {
      const newExpiresAt = Math.max(post.expiresAt, Date.now()) + args.extendMinutes * 60 * 1000;
      updates.expiresAt = newExpiresAt;
    }

    await ctx.db.patch(args.postId, updates);

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
      // User already reported, so unreport (toggle behavior)
      const newReportedBy = reportedBy.filter((id) => id !== user._id);
      const newReportCount = newReportedBy.length;
      await ctx.db.patch(args.postId, {
        goneReports: newReportCount,
        reportedBy: newReportedBy,
      });

      // Update or delete the notification
      const existingNotification = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_post", (q) =>
          q.eq("userId", post.createdBy).eq("foodPostId", args.postId)
        )
        .first();

      if (existingNotification) {
        if (newReportCount === 0) {
          await ctx.db.delete(existingNotification._id);
        } else {
          await ctx.db.patch(existingNotification._id, {
            reportCount: newReportCount,
          });
        }
      }

      return { success: true, reportCount: newReportCount, action: "unreported" };
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

    return { success: true, reportCount: newReportCount, action: "reported" };
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
