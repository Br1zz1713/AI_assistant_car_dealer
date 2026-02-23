import { model } from "./gemini";

export interface RawScrapedData {
    brand: string;
    model: string;
    description: string;
    techSpecs: {
        mileage: string;
        fuel: string;
        gearbox: string;
        price: string;
    };
    sourcePlatform: string;
}

export interface NormalizedCar {
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
    gearbox: 'Manual' | 'Automatic';
    translatedDescription: string;
    isDuplicate: boolean;
}

/**
 * Normalizes scraped data using Gemini Flash 1.5.
 * Handles translation, unit conversion, and standardization.
 */
export async function normalizeScrapedData(raw: RawScrapedData, targetLocale: string = "English"): Promise<NormalizedCar> {
    const prompt = `
    Normalize this scraped car data from ${raw.sourcePlatform}.
    Translate the description to ${targetLocale}.
    Standardize tech specs into the following format:
    - Fuel: one of [Petrol, Diesel, Electric, Hybrid]
    - Gearbox: one of [Manual, Automatic]
    - Price: Pure integer (Euro)
    - Mileage: Pure integer (km)
    
    Data:
    Brand/Model: ${raw.brand} ${raw.model}
    Raw Description: ${raw.description}
    Raw Specs: ${JSON.stringify(raw.techSpecs)}
    
    Respond STRICTLY in JSON:
    {
      "brand": string,
      "model": string,
      "year": number,
      "price": number,
      "mileage": number,
      "fuel": "string",
      "gearbox": "string",
      "translatedDescription": "string"
    }
  `;

    try {
        if (!model) throw new Error("AI Model not initialized (missing API key)");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanedJson);

        return {
            ...parsed,
            isDuplicate: false, // Default to false, handled by separate logic
        };
    } catch (error) {
        console.error("AI Normalization failed:", error);
        throw error;
    }
}

/**
 * Logic to detect if a listing is a duplicate of an existing one.
 */
export async function detectDuplicate(newCar: Partial<NormalizedCar>, existingCars: NormalizedCar[]): Promise<boolean> {
    // AI-powered duplicate detection (comparing specs and descriptions)
    const prompt = `
    Compare this new listing to the existing listings.
    Is it likely a duplicate (same car, different platform)?
    New Listing: ${JSON.stringify(newCar)}
    Existing Listings: ${JSON.stringify(existingCars.slice(0, 5))}
    
    Respond with "YES" or "NO" and a confidence score.
    Format: YES|CONFIDENCE or NO|CONFIDENCE
  `;

    try {
        if (!model) return false;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text.toUpperCase().startsWith("YES");
    } catch (error) {
        return false;
    }
}
