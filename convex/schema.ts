import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Campus data - seeded with major US universities
  campuses: defineTable({
    name: v.string(),
    city: v.string(),
    state: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  })
    .index("by_state", ["state"])
    .searchIndex("search_name", { searchField: "name" }),

  // User profiles linked to Clerk
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    campusId: v.optional(v.id("campuses")),
  }).index("by_clerk_id", ["clerkId"]),

  // Food posts created by users
  foodPosts: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    foodType: v.union(
      v.literal("pizza"),
      v.literal("sandwiches"),
      v.literal("snacks"),
      v.literal("drinks"),
      v.literal("desserts"),
      v.literal("asian"),
      v.literal("mexican"),
      v.literal("other")
    ),
    // Location info
    campusId: v.id("campuses"),
    locationName: v.string(), // e.g., "Engineering Building Room 101"
    latitude: v.number(),
    longitude: v.number(),
    // Timing
    expiresAt: v.number(), // Unix timestamp
    // Media
    imageId: v.optional(v.id("_storage")),
    // Ownership
    createdBy: v.id("users"),
    // Status
    isActive: v.boolean(),
    dietaryTags: v.optional(v.array(v.union(
      v.literal("vegetarian"),
      v.literal("vegan"),
      v.literal("halal"),
      v.literal("kosher"),
      v.literal("gluten-free"),
      v.literal("dairy-free"),
      v.literal("nut-free")
    ))),
    markedGoneBy: v.optional(v.id("users")),
    // Track reports from non-creators that the food is gone
    goneReports: v.optional(v.number()),
    // Track which users have reported (to prevent duplicate reports)
    reportedBy: v.optional(v.array(v.id("users"))),
  })
    .index("by_campus", ["campusId", "isActive"])
    .index("by_creator", ["createdBy"])
    .index("by_expires", ["expiresAt"]),

  // Notifications for users
  notifications: defineTable({
    userId: v.id("users"), // The user receiving the notification
    type: v.union(
      v.literal("food_reported_gone"),
      v.literal("food_expired")
    ),
    foodPostId: v.id("foodPosts"),
    foodTitle: v.string(),
    reportCount: v.optional(v.number()),
    isRead: v.boolean(),
  })
    .index("by_user", ["userId", "isRead"])
    .index("by_user_and_post", ["userId", "foodPostId"]),
});
