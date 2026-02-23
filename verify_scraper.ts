import { supabase } from "./src/lib/supabase";
import { scraper } from "./src/lib/scraper";

async function verify() {
    console.log("--- SCRAPER VERIFICATION ---");

    // 1. Check subscriptions
    const { data: subs, error: subError } = await supabase
        .from("spotting_subscriptions")
        .select("*");

    if (subError) {
        console.error("Failed to fetch subscriptions:", subError);
        return;
    }

    console.log(`Found ${subs?.length || 0} subscriptions.`);

    if (!subs || subs.length === 0) {
        console.log("Creating a test subscription...");
        const { error: insertError } = await supabase
            .from("spotting_subscriptions")
            .insert({
                filters: {
                    brand: "BMW",
                    model: "X5",
                    countries: ["Romania"]
                }
            });
        if (insertError) console.error("Failed to create test sub:", insertError);
        else console.log("Test subscription created.");
    }

    // 2. Trigger a sample scrape
    console.log("Testing scraper for BMW X5 in Romania...");
    try {
        const cars = await scraper.getCars("Romania", "BMW", "X5");
        console.log(`Scraper returned ${cars.length} vehicles.`);
        if (cars.length > 0) {
            console.log("First Car Sample:", {
                title: cars[0].title,
                price: cars[0].price,
                image: cars[0].image ? "YES" : "NO",
                year: cars[0].year
            });
        }
    } catch (err) {
        console.error("Scrape test failed:", err);
    }
}

verify();
