import { NextResponse } from "next/server";
import { getSpotSummary } from "@/lib/ai-service";

export async function POST(request: Request) {
    try {
        const car = await request.json();
        const summary = await getSpotSummary(car);
        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Spot Summary Error:", error);
        return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }
}
