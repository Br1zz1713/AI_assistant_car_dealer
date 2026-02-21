import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

// Build-safe initialization
if (!apiKey) {
    console.warn("GOOGLE_GEMINI_API_KEY is missing. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
