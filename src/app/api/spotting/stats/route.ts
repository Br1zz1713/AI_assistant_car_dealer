import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { count, error: countError } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true });

        if (countError) throw countError;

        const { data: latestCheck, error: checkError } = await supabase
            .from("spotting_subscriptions")
            .select("last_check")
            .order("last_check", { ascending: false })
            .limit(1);

        if (checkError) throw checkError;

        return NextResponse.json({
            totalListings: count || 0,
            lastPulse: latestCheck?.[0]?.last_check || null,
            systemStatus: "Operational"
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
