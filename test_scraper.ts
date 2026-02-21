import { ScraperEngine } from "./src/lib/scraper";

async function run() {
    const scraper = new ScraperEngine();
    const countries = ["Poland", "Romania", "Bulgaria", "Moldova"];

    for (const country of countries) {
        console.log(`\n--- Testing ${country} ---`);
        try {
            const cars = await scraper.getCars(country, "bmw", "3-series");
            console.log(`${country}: Found ${cars.length} cars`);
            if (cars.length > 0) {
                console.log(JSON.stringify(cars.slice(0, 2), null, 2));
            }
        } catch (e) {
            console.error(`${country} Error:`, e);
        }
    }
}

run().catch(console.error);
