import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { allCampuses } from "./campusData";

// Get all campuses, optionally filtered by state
export const list = query({
  args: {
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.state) {
      return await ctx.db
        .query("campuses")
        .withIndex("by_state", (q) => q.eq("state", args.state!))
        .collect();
    }
    return await ctx.db.query("campuses").collect();
  },
});

// Search campuses by name
export const search = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return await ctx.db.query("campuses").take(20);
    }
    return await ctx.db
      .query("campuses")
      .withSearchIndex("search_name", (q) => q.search("name", args.searchTerm))
      .take(20);
  },
});

// Get a single campus by ID
export const get = query({
  args: {
    campusId: v.id("campuses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campusId);
  },
});

// Get all unique states (for filtering)
export const getStates = query({
  args: {},
  handler: async (ctx) => {
    const campuses = await ctx.db.query("campuses").collect();
    const states = [...new Set(campuses.map((c) => c.state))].sort();
    return states;
  },
});

// Internal mutation to seed campus data
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("campuses").first();
    if (existing) {
      return { message: "Campuses already seeded" };
    }

    for (const campus of allCampuses) {
      await ctx.db.insert("campuses", campus);
    }

    return { message: `Seeded ${allCampuses.length} campuses` };
  },
});

// Internal mutation to reseed all campus data (clears existing and reseeds)
export const reseed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing campuses
    const existing = await ctx.db.query("campuses").collect();
    for (const campus of existing) {
      await ctx.db.delete(campus._id);
    }

    // Insert all campuses from the expanded list
    for (const campus of allCampuses) {
      await ctx.db.insert("campuses", campus);
    }

    return { message: `Reseeded with ${allCampuses.length} campuses` };
  },
});
