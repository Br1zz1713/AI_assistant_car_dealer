import { NextResponse } from "next/server";
import { scraper } from "@/lib/scraper";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "all";
    const brand = searchParams.get("brand") || undefined;
    const model = searchParams.get("model") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

    try {
        const cars = await scraper.getCars(country, brand, model, minPrice, maxPrice);
        return NextResponse.json({ cars });
    } catch (error) {
        console.error("Aggregation Error:", error);
        return NextResponse.json({ error: "Failed to fetch aggregated data" }, { status: 500 });
    }
}
