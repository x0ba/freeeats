import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

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

    const campuses = [
      // California
      { name: "UCLA", city: "Los Angeles", state: "CA", latitude: 34.0689, longitude: -118.4452 },
      { name: "UC Berkeley", city: "Berkeley", state: "CA", latitude: 37.8719, longitude: -122.2585 },
      { name: "Stanford University", city: "Stanford", state: "CA", latitude: 37.4275, longitude: -122.1697 },
      { name: "UC San Diego", city: "La Jolla", state: "CA", latitude: 32.8801, longitude: -117.234 },
      { name: "USC", city: "Los Angeles", state: "CA", latitude: 34.0224, longitude: -118.2851 },
      { name: "UC Davis", city: "Davis", state: "CA", latitude: 38.5382, longitude: -121.7617 },
      { name: "UC Irvine", city: "Irvine", state: "CA", latitude: 33.6405, longitude: -117.8443 },
      { name: "Cal Poly SLO", city: "San Luis Obispo", state: "CA", latitude: 35.3050, longitude: -120.6625 },
      { name: "UCSB", city: "Santa Barbara", state: "CA", latitude: 34.4140, longitude: -119.8489 },
      { name: "UC Santa Cruz", city: "Santa Cruz", state: "CA", latitude: 36.9916, longitude: -122.0583 },
      // New York
      { name: "NYU", city: "New York", state: "NY", latitude: 40.7295, longitude: -73.9965 },
      { name: "Columbia University", city: "New York", state: "NY", latitude: 40.8075, longitude: -73.9626 },
      { name: "Cornell University", city: "Ithaca", state: "NY", latitude: 42.4534, longitude: -76.4735 },
      { name: "Syracuse University", city: "Syracuse", state: "NY", latitude: 43.0392, longitude: -76.1351 },
      { name: "University at Buffalo", city: "Buffalo", state: "NY", latitude: 43.0008, longitude: -78.7890 },
      // Texas
      { name: "UT Austin", city: "Austin", state: "TX", latitude: 30.2849, longitude: -97.7341 },
      { name: "Texas A&M", city: "College Station", state: "TX", latitude: 30.6187, longitude: -96.3365 },
      { name: "Rice University", city: "Houston", state: "TX", latitude: 29.7174, longitude: -95.4018 },
      { name: "UT Dallas", city: "Richardson", state: "TX", latitude: 32.9857, longitude: -96.7502 },
      { name: "Texas Tech", city: "Lubbock", state: "TX", latitude: 33.5843, longitude: -101.8783 },
      // Massachusetts
      { name: "MIT", city: "Cambridge", state: "MA", latitude: 42.3601, longitude: -71.0942 },
      { name: "Harvard University", city: "Cambridge", state: "MA", latitude: 42.3770, longitude: -71.1167 },
      { name: "Boston University", city: "Boston", state: "MA", latitude: 42.3505, longitude: -71.1054 },
      { name: "Northeastern University", city: "Boston", state: "MA", latitude: 42.3398, longitude: -71.0892 },
      { name: "UMass Amherst", city: "Amherst", state: "MA", latitude: 42.3912, longitude: -72.5267 },
      // Illinois
      { name: "UIUC", city: "Urbana-Champaign", state: "IL", latitude: 40.1020, longitude: -88.2272 },
      { name: "Northwestern University", city: "Evanston", state: "IL", latitude: 42.0565, longitude: -87.6753 },
      { name: "University of Chicago", city: "Chicago", state: "IL", latitude: 41.7886, longitude: -87.5987 },
      { name: "UIC", city: "Chicago", state: "IL", latitude: 41.8719, longitude: -87.6484 },
      // Pennsylvania
      { name: "Penn State", city: "State College", state: "PA", latitude: 40.7982, longitude: -77.8599 },
      { name: "University of Pennsylvania", city: "Philadelphia", state: "PA", latitude: 39.9522, longitude: -75.1932 },
      { name: "Carnegie Mellon", city: "Pittsburgh", state: "PA", latitude: 40.4433, longitude: -79.9436 },
      { name: "Pitt", city: "Pittsburgh", state: "PA", latitude: 40.4444, longitude: -79.9608 },
      // Florida
      { name: "UF", city: "Gainesville", state: "FL", latitude: 29.6436, longitude: -82.3549 },
      { name: "FSU", city: "Tallahassee", state: "FL", latitude: 30.4419, longitude: -84.2985 },
      { name: "University of Miami", city: "Coral Gables", state: "FL", latitude: 25.7215, longitude: -80.2794 },
      { name: "UCF", city: "Orlando", state: "FL", latitude: 28.6024, longitude: -81.2001 },
      // Michigan
      { name: "University of Michigan", city: "Ann Arbor", state: "MI", latitude: 42.2780, longitude: -83.7382 },
      { name: "Michigan State", city: "East Lansing", state: "MI", latitude: 42.7018, longitude: -84.4822 },
      // Ohio
      { name: "Ohio State", city: "Columbus", state: "OH", latitude: 40.0067, longitude: -83.0305 },
      { name: "Case Western Reserve", city: "Cleveland", state: "OH", latitude: 41.5045, longitude: -81.6089 },
      // Georgia
      { name: "Georgia Tech", city: "Atlanta", state: "GA", latitude: 33.7756, longitude: -84.3963 },
      { name: "UGA", city: "Athens", state: "GA", latitude: 33.9480, longitude: -83.3773 },
      // North Carolina
      { name: "Duke University", city: "Durham", state: "NC", latitude: 36.0014, longitude: -78.9382 },
      { name: "UNC Chapel Hill", city: "Chapel Hill", state: "NC", latitude: 35.9049, longitude: -79.0469 },
      { name: "NC State", city: "Raleigh", state: "NC", latitude: 35.7847, longitude: -78.6821 },
      // Washington
      { name: "University of Washington", city: "Seattle", state: "WA", latitude: 47.6553, longitude: -122.3035 },
      { name: "Washington State", city: "Pullman", state: "WA", latitude: 46.7298, longitude: -117.1817 },
      // Colorado
      { name: "CU Boulder", city: "Boulder", state: "CO", latitude: 40.0076, longitude: -105.2659 },
      { name: "Colorado State", city: "Fort Collins", state: "CO", latitude: 40.5734, longitude: -105.0865 },
      // Arizona
      { name: "ASU", city: "Tempe", state: "AZ", latitude: 33.4255, longitude: -111.9400 },
      { name: "University of Arizona", city: "Tucson", state: "AZ", latitude: 32.2319, longitude: -110.9501 },
    ];

    for (const campus of campuses) {
      await ctx.db.insert("campuses", campus);
    }

    return { message: `Seeded ${campuses.length} campuses` };
  },
});
