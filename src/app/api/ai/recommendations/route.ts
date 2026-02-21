import { NextResponse } from "next/server";
import { getAiRecommendations } from "@/lib/ai-service";
import { mockCars } from "@/lib/mockData";

export async function POST(request: Request) {
    try {
        const { carId } = await request.json();
        const currentCar = mockCars.find(c => c.id === carId);

        if (!currentCar) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 });
        }

        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json({ recommendations: [] });
        }

        const recommendations = await getAiRecommendations(
            currentCar.brand,
            currentCar.model,
            currentCar.price
        );

        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error("AI Recommendations Error:", error);
        return NextResponse.json({ recommendations: [] });
    }
}
