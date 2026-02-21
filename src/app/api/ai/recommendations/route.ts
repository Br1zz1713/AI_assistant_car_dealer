import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { mockCars } from "@/lib/mockData";

export async function POST(request: Request) {
    try {
        const { carId, budget } = await request.json();
        const currentCar = mockCars.find(c => c.id === carId);

        if (!currentCar) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 });
        }

        const prompt = `
      Current car: ${currentCar.brand} ${currentCar.model} (${currentCar.year}, ${currentCar.fuel}, €${currentCar.price})
      User budget: €${budget || currentCar.price + 5000}
      
      Recommend 3 similar car alternatives available in the European market.
      Return ONLY a JSON array of objects with fields: brand, model, price, segment_reason.
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const recommendations = JSON.parse(cleanJson);

        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error("AI Recommendations Error:", error);
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
}
