import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
        console.error("CRITICAL: GOOGLE_GEMINI_API_KEY is missing in production!");
    } else {
        console.warn("GOOGLE_GEMINI_API_KEY is missing. AI features will fallback to mock data.");
    }
}

// Initialize only if key is present to avoid confusing 403 errors from the SDK
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Use the latest stable flash model
export const model = genAI ? genAI.getGenerativeModel(
    { model: "gemini-1.5-flash" },
    { apiVersion: 'v1' }
) : null;
