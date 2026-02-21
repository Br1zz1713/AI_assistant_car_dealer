import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

// Robust check for API key
if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
        console.error("CRITICAL: GOOGLE_GEMINI_API_KEY is missing in production!");
    } else {
        console.warn("GOOGLE_GEMINI_API_KEY is missing. AI features will fallback to mock data.");
    }
}

// Initialize with v1 API version for stability
const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

// Use the latest stable flash model
export const model = genAI.getGenerativeModel(
    { model: "gemini-1.5-flash" },
    { apiVersion: 'v1' }
);
