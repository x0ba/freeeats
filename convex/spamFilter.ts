"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * Spam filter action that uses Gemini to validate food posts.
 * Checks both text content and images to ensure they are food-related.
 */
export const moderateContent = internalAction({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.object({
    isValid: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (_ctx, args): Promise<{ isValid: boolean; reason?: string }> => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      // If no API key is configured, allow all posts (graceful degradation)
      console.warn("GOOGLE_GENERATIVE_AI_API_KEY not set, skipping spam filter");
      return { isValid: true };
    }

    const model = google("gemini-2.5-flash");

    // Build the content to analyze
    const textContent = args.description
      ? `Title: ${args.title}\nDescription: ${args.description}`
      : `Title: ${args.title}`;

    // If there's an image, analyze both text and image together
    if (args.imageUrl) {
      const result = await generateText({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a content moderator for a free food sharing app on college campuses. Your job is to determine if a post is legitimately about food.

Analyze the following post and determine if it is food-related:

${textContent}

The post also includes an image (shown below).

Rules:
1. The post MUST be about food (free food, leftovers, snacks, drinks, etc.)
2. The image MUST show food, food packaging, food containers, or a food-related location
3. Reject posts that are clearly spam, advertisements, inappropriate content, or not about food
4. Be lenient with edge cases - if it could reasonably be food-related, allow it

Respond with a JSON object containing:
- "isValid": true if the post is food-related, false otherwise
- "reason": if rejected, a brief, friendly explanation (e.g., "This doesn't appear to be about food")

Return ONLY the JSON object, no additional text.`,
              },
              {
                type: "image",
                image: args.imageUrl,
              },
            ],
          },
        ],
      });

      return parseModeratorResponse(result.text);
    }

    // Text-only moderation
    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: `You are a content moderator for a free food sharing app on college campuses. Your job is to determine if a post is legitimately about food.

Analyze the following post and determine if it is food-related:

${textContent}

Rules:
1. The post MUST be about food (free food, leftovers, snacks, drinks, etc.)
2. Reject posts that are clearly spam, advertisements, inappropriate content, or not about food
3. Be lenient with edge cases - if it could reasonably be food-related, allow it

Respond with a JSON object containing:
- "isValid": true if the post is food-related, false otherwise
- "reason": if rejected, a brief, friendly explanation (e.g., "This doesn't appear to be about food")

Return ONLY the JSON object, no additional text.`,
        },
      ],
    });

    return parseModeratorResponse(result.text);
  },
});

/**
 * Parse the moderator's JSON response
 */
function parseModeratorResponse(response: string): {
  isValid: boolean;
  reason?: string;
} {
  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr) as { isValid?: boolean; reason?: string };

    if (typeof parsed.isValid === "boolean") {
      return {
        isValid: parsed.isValid,
        reason: parsed.reason,
      };
    }

    // If parsing fails or invalid format, allow the post (fail open)
    console.warn("Unexpected moderator response format:", response);
    return { isValid: true };
  } catch (error) {
    console.warn("Failed to parse moderator response:", response, error);
    return { isValid: true };
  }
}
