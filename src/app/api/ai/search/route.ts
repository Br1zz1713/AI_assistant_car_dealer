import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { mockCars } from "@/lib/mockData";

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const prompt = `
      You are an AI car assistant. Analyze the user's query and extract car search parameters.
      User query: "${query}"
      
      Return ONLY a JSON object with the following fields:
      - brand (string or null)
      - model (string or null)
      - maxPrice (number or null)
      - country (string or null)
      - fuel (string or null)
      
      Example: "Find me a BMW for under 30000 in Germany"
      { "brand": "BMW", "model": null, "maxPrice": 30000, "country": "Germany", "fuel": null }
    `;

        if (!model) throw new Error("AI Model not initialized");

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const params = JSON.parse(cleanJson);

        // Filter mock data based on AI-extracted params
        const filteredCars = mockCars.filter((car) => {
            let match = true;
            if (params.brand && !car.brand.toLowerCase().includes(params.brand.toLowerCase())) match = false;
            if (params.model && !car.model.toLowerCase().includes(params.model.toLowerCase())) match = false;
            if (params.maxPrice && car.price > params.maxPrice) match = false;
            if (params.country && !car.country.toLowerCase().includes(params.country.toLowerCase())) match = false;
            if (params.fuel && !car.fuel.toLowerCase().includes(params.fuel.toLowerCase())) match = false;
            return match;
        });

        return NextResponse.json({ cars: filteredCars, params });
    } catch (error) {
        console.error("AI Search Error:", error);
        // On error, return all mock cars as a fallback instead of a 500
        return NextResponse.json({
            cars: mockCars.slice(0, 10),
            params: { brand: null, model: null, maxPrice: null, country: null, fuel: null }
        });
    }
}
