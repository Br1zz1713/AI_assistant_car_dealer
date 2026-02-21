import { model } from "./gemini";

export interface AIRecommendation {
    brand: string;
    model: string;
    price: number;
    segment_reason: string;
}

/**
 * Fetches AI-powered car recommendations based on current car details.
 * Suggestions are filtered by vehicle class and a +/- 15% budget margin.
 */
export async function getAiRecommendations(
    brand: string,
    modelName: string,
    price: number
): Promise<AIRecommendation[]> {
    const budgetMin = price * 0.85;
    const budgetMax = price * 1.15;

    const prompt = `
        You are an expert automotive advisor.
        The user is looking at a ${brand} ${modelName} with a price of €${price}.
        
        Suggest 3 alternative car models that:
        1. Are in the SAME vehicle class (e.g., if it's a compact hatchback, suggest other compact hatchbacks).
        2. Have an estimated European market price between €${budgetMin.toFixed(0)} and €${budgetMax.toFixed(0)} (+/- 15% of the original budget).
        3. Offer a distinct value proposition (e.g., better reliability, more luxury, sporty handling).
        
        Return ONLY a raw JSON array of objects with the following structure:
        [
            {
                "brand": "Brand Name",
                "model": "Model Name",
                "price": 12345,
                "segment_reason": "Direct, one-sentence explanation of why this is a good alternative in the same class."
            }
        ]
        
        Return NOTHING else but the raw JSON array.
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson) as AIRecommendation[];
    } catch (error) {
        console.error("AI Service Error (getAiRecommendations):", error);

        // Return high-quality mock fallbacks if AI fails
        return [
            {
                brand: brand === "BMW" ? "Audi" : "BMW",
                model: "Alternative",
                price: price * 0.95,
                segment_reason: "A reliable alternative in the same vehicle class with competitive pricing."
            },
            {
                brand: "Mercedes-Benz",
                model: "Luxury Option",
                price: price * 1.1,
                segment_reason: "Provides a more premium interior and smooth ride quality."
            }
        ];
    }
}

/**
 * Generates a catchy one-sentence summary for a new car find.
 */
export async function getSpotSummary(car: { brand: string, model: string, location: string, price: number }): Promise<string> {
    const prompt = `
        Generate a catchy, professional one-sentence summary for a new car deal.
        Car: ${car.brand} ${car.model} in ${car.location} for €${car.price.toLocaleString()}.
        
        Example: "🔥 Fresh find in Bucharest: Audi A6 at a 10% market discount"
        
        Return ONLY the summary text.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("AI Service Error (getSpotSummary):", error);
        // Clean fallback without AI tone
        return `New match found: ${car.brand} ${car.model} in ${car.location} for €${car.price.toLocaleString()}.`;
    }
}
