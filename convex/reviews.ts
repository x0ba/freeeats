import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Generate upload URL for review images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Add or update a review for a food post
export const addReview = mutation({
  args: {
    foodPostId: v.id("foodPosts"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")), // Optional review photo
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if post exists
    const post = await ctx.db.get(args.foodPostId);
    if (!post) throw new Error("Food post not found");

    // Prevent creators from reviewing their own food
    if (post.createdBy === user._id) {
      throw new Error("You cannot review your own food post");
    }

    // Check if user already reviewed this post
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_food_and_user", (q) =>
        q.eq("foodPostId", args.foodPostId).eq("userId", user._id)
      )
      .first();

    if (existingReview) {
      // If updating and old image exists but new one is different, delete old one
      if (existingReview.imageId && existingReview.imageId !== args.imageId) {
        await ctx.storage.delete(existingReview.imageId);
      }
      // Update existing review
      await ctx.db.patch(existingReview._id, {
        rating: args.rating,
        comment: args.comment,
        imageId: args.imageId,
      });
      return { success: true, action: "updated", reviewId: existingReview._id };
    }

    // Create new review
    const reviewId = await ctx.db.insert("reviews", {
      foodPostId: args.foodPostId,
      userId: user._id,
      rating: args.rating,
      comment: args.comment,
      imageId: args.imageId,
    });

    return { success: true, action: "created", reviewId };
  },
});

// Delete a review
export const deleteReview = mutation({
  args: {
    reviewId: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    // Only the reviewer can delete their review
    if (review.userId !== user._id) {
      throw new Error("You can only delete your own reviews");
    }

    // Delete associated image if exists
    if (review.imageId) {
      await ctx.storage.delete(review.imageId);
    }

    await ctx.db.delete(args.reviewId);
    return { success: true };
  },
});

// Get all reviews for a food post
export const getForFoodPost = query({
  args: {
    foodPostId: v.id("foodPosts"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_food_post", (q) => q.eq("foodPostId", args.foodPostId))
      .collect();

    // Enrich with user info and image URLs
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const imageUrl = review.imageId
          ? await ctx.storage.getUrl(review.imageId)
          : null;
        return {
          ...review,
          user: user
            ? { name: user.name, imageUrl: user.imageUrl }
            : { name: "Unknown", imageUrl: null },
          imageUrl,
        };
      })
    );

    // Sort by newest first
    return enrichedReviews.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Get average rating and count for a food post
export const getStats = query({
  args: {
    foodPostId: v.id("foodPosts"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_food_post", (q) => q.eq("foodPostId", args.foodPostId))
      .collect();

    if (reviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
    };
  },
});

// Get current user's review for a food post
export const getUserReview = query({
  args: {
    foodPostId: v.id("foodPosts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const review = await ctx.db
      .query("reviews")
      .withIndex("by_food_and_user", (q) =>
        q.eq("foodPostId", args.foodPostId).eq("userId", user._id)
      )
      .first();

    return review ?? null;
  },
});
