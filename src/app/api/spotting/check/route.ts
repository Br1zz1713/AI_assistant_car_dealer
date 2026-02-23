import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { scraper, wait } from "@/lib/scraper";

export async function GET(request: Request) {
    const startTime = Date.now();
    const VERCEL_TIMEOUT_MS = 9000;

    // Authorization check for Vercel Cron or Manual Debug
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get("manual") === "true";
    const cronSecret = process.env.CRON_SECRET;

    if (!isManual && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.time("SpottingCheckTotal");

        // 1. Fetch active subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from("spotting_subscriptions")
            .select("*");

        if (subError) throw subError;

        let totalNewCars = 0;

        // 2. Process each subscription sequentially (Anti-Ban Measures)
        for (const sub of subscriptions) {
            const { brand, model, countries } = sub.filters;

            for (const country of countries) {
                // Check if we are approaching timeout
                if (Date.now() - startTime > VERCEL_TIMEOUT_MS) {
                    console.warn(`[Spotting] Timeout approaching (${Date.now() - startTime}ms). Saving progress and exiting.`);
                    break;
                }

                console.time(`Scan-${country}-${sub.id}`);

                // 3. Fetch data (Scraper already handles AI normalization)
                const listings = await scraper.getCars(country, brand, model);

                // 4. Database Upsert with duplicate prevention
                if (listings.length > 0) {
                    console.log(`[Spotting] Processing ${listings.length} listings for ${brand} ${model} in ${country}`);
                    for (const car of listings) {
                        const { data: newId, error: upsertError } = await supabase.rpc("upsert_listing", {
                            p_external_id: car.id,
                            p_source_platform: car.sourcePlatform,
                            p_url: car.sourceUrl,
                            p_title: car.title,
                            p_price_eur: car.price_eur,
                            p_images: car.images,
                            p_specs: {
                                year: car.year,
                                mileage: car.mileage,
                                fuel: car.fuel,
                                gearbox: car.gearbox,
                                location: car.location
                            },
                            p_country: car.country
                        });

                        if (!upsertError && newId) {
                            totalNewCars++;
                        } else if (upsertError) {
                            console.error(`[Spotting] Upsert error:`, upsertError);
                        }
                    }
                }

                console.timeEnd(`Scan-${country}-${sub.id}`);

                // 6. Mandatory delay between country requests (2-5 seconds random)
                const delay = Math.floor(Math.random() * 3000) + 2000;
                await wait(delay);
            }

            // Update subscription's last_check timestamp
            await supabase
                .from("spotting_subscriptions")
                .update({ last_check: new Date().toISOString() })
                .eq("id", sub.id);

            if (Date.now() - startTime > VERCEL_TIMEOUT_MS) break;
        }

        console.timeEnd("SpottingCheckTotal");

        return NextResponse.json({
            success: true,
            message: `Spotting check complete. Found ${totalNewCars} new matches.`,
            executionTime: `${Date.now() - startTime}ms`
        });

    } catch (error) {
        console.error("Critical Spotting Check Error:", error);
        return NextResponse.json({ error: "Failed to perform spotting check" }, { status: 500 });
    }
}
