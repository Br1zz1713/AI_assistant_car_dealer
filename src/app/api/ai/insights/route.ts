import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { mockCars } from "@/lib/mockData";

export async function POST(request: Request) {
    try {
        const { carId } = await request.json();
        const car = mockCars.find(c => c.id === carId);

        if (!car) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 });
        }

        const prompt = `
      Analyze the "Value for Money" and provide a concise "Pros & Cons" summary for the following car:
      ${car.brand} ${car.model} ${car.year} (${car.fuel}, ${car.mileage}km, €${car.price})
      
      Return ONLY a JSON object with fields:
      - valueScore (number between 0-100)
      - marketStatus ("Great Deal" | "Fair Price" | "Overpriced")
      - pros (array of strings, max 3)
      - cons (array of strings, max 3)
      - summary (string, max 200 characters)
      
      Base the valueScore on the balance of age, mileage, brand reliability, and price relative to the European market average.
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const insights = JSON.parse(cleanJson);

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("AI Insights Error:", error);
        return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }
}
