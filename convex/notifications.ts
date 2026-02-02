import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Get all notifications for the current user
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    return notifications;
  },
});

// Get unread notification count for the current user
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    return unreadNotifications.length;
  },
});

// Mark a notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    if (notification.userId !== user._id) {
      throw new Error("Not authorized to update this notification");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
    return { success: true };
  },
});

// Mark all notifications as read for current user
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true };
  },
});

// Internal mutation to create or update a "food reported gone" notification
export const createFoodReportedNotification = internalMutation({
  args: {
    creatorId: v.id("users"),
    foodPostId: v.id("foodPosts"),
    foodTitle: v.string(),
    reportCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if there's already a notification for this food post
    const existingNotification = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", args.creatorId).eq("foodPostId", args.foodPostId)
      )
      .first();

    if (existingNotification) {
      // Update the existing notification with new report count and mark as unread
      await ctx.db.patch(existingNotification._id, {
        reportCount: args.reportCount,
        isRead: false,
      });
    } else {
      // Create a new notification
      await ctx.db.insert("notifications", {
        userId: args.creatorId,
        type: "food_reported_gone",
        foodPostId: args.foodPostId,
        foodTitle: args.foodTitle,
        reportCount: args.reportCount,
        isRead: false,
      });
    }
  },
});
