import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { allCampuses } from "./campusData";
import Fuse from "fuse.js";

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

// Search campuses by name using Fuse.js for intelligent fuzzy matching
export const search = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const term = args.searchTerm.trim();
    
    // Get all campuses from database
    const campuses = await ctx.db.query("campuses").collect();
    
    if (!term) {
      // Return empty when no search term - UI will prompt user to type
      return [];
    }
    
    // For very short queries (1-2 chars), do a simple prefix/contains match
    // This is faster and more intuitive for short queries
    if (term.length <= 2) {
      const lowerTerm = term.toLowerCase();
      const matches = campuses.filter((c) => 
        c.name.toLowerCase().includes(lowerTerm) ||
        c.state.toLowerCase() === lowerTerm
      );
      // Sort matches: starts with term first, then alphabetically
      matches.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(lowerTerm);
        const bStarts = b.name.toLowerCase().startsWith(lowerTerm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      });
      return matches.slice(0, 50);
    }
    
    // Configure Fuse.js for optimal autocomplete behavior
    const fuse = new Fuse(campuses, {
      keys: [
        { name: "name", weight: 0.7 },      // Name is most important
        { name: "city", weight: 0.2 },      // City is secondary
        { name: "state", weight: 0.1 },     // State is tertiary
      ],
      threshold: 0.35,          // Slightly stricter for better matches
      distance: 200,            // Allow matches further in the string
      ignoreLocation: true,     // Match anywhere in the string
      includeScore: true,       // For sorting
      minMatchCharLength: 2,    // Ignore single char matches
      shouldSort: true,         // Sort by relevance score
      findAllMatches: true,     // Find all possible matches
    });
    
    // Perform the search - get more results so users can scroll
    const results = fuse.search(term, { limit: 50 });
    
    // Return just the campus objects (Fuse wraps them in { item, score })
    return results.map((result) => result.item);
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
