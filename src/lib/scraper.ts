/**
 * scraper.ts — Real multi-country car scraper
 *
 * Uses stealthFetch for HTTP requests with anti-bot bypass.
 * Falls back to Gemini 1.5 Flash for HTML parsing if direct extraction yields 0 results.
 */

import { model } from "./gemini";
import { stealthFetch, repairWithGemini } from "./fetcher";
import { Car } from "@/types/car";

export type ScrapedCar = Car;

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

// ─── HTML parsing helpers ─────────────────────────────────────────────────────

/**
 * Extracts attribute value from HTML string using regex (no DOM needed).
 */
function extractAttr(html: string, tag: string, attr: string): string[] {
    const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "gi");
    const results: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) results.push(m[1]);
    return results;
}

/**
 * Strips HTML tags and decodes common entities.
 */
function stripHtml(s: string): string {
    return s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Extracts a number from a string (price / mileage).
 */
function extractNumber(s: string): number {
    const n = s.replace(/[^\d]/g, "");
    return n ? parseInt(n, 10) : 0;
}

// ─── ScraperEngine ────────────────────────────────────────────────────────────

export class ScraperEngine {
    /**
     * Extracts car data from __NEXT_DATA__ script tag if available (Otomoto/Autovit)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private extractCarsFromNextData(html: string): Record<string, any>[] | null {
        try {
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
            if (!nextDataMatch) return null;
            const data = JSON.parse(nextDataMatch[1]);
            const urqlState = data.props?.pageProps?.urqlState;
            if (!urqlState) return null;

            for (const key in urqlState) {
                const entry = urqlState[key];
                if (entry.data) {
                    const parsed = JSON.parse(entry.data);
                    const advertSearch = parsed.advertSearch || parsed.searchAdvertisements;
                    if (advertSearch && advertSearch.edges) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return advertSearch.edges.map((edge: any) => {
                            const node = edge.node;
                            const params = node.parameters || [];
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const getParam = (k: string) => params.find((p: any) => p.key === k)?.value;

                            return {
                                id: node.id,
                                url: node.url,
                                title: node.title,
                                price: node.price?.value || node.price?.total?.amount || node.price?.amount || 0,
                                currency: node.price?.currency || node.price?.currencyCode || "EUR",
                                images: (node.images && node.images.length > 0)
                                    ? node.images.map((img: any) => img.src || img.x1 || img.x2)
                                    : (node.thumbnail ? [node.thumbnail.x1 || node.thumbnail.x2 || node.thumbnail.src] : []),
                                year: parseInt(getParam('year') || getParam('rok-produkcji') || "0", 10),
                                mileage: parseInt(getParam('mileage') || getParam('przebieg') || "0", 10),
                                fuel: getParam('fuel_type') || getParam('rodzaj-paliwa') || "Unknown",
                                gearbox: getParam('gearbox') || getParam('skrzynia-biegow') || "Unknown",
                                brand: getParam('make') || getParam('marka-pojazdu') || "Unknown",
                                model: getParam('model') || getParam('model-pojazdu') || "Unknown",
                                location: node.location?.city?.name || node.location?.region?.name || "Unknown"
                            };
                        });
                    }
                }
            }
        } catch (e) {
            console.warn("[Scraper] Error extracting from __NEXT_DATA__", e);
        }
        return null;
    }

    /**
     * Normalizes raw car data using Gemini 1.5 Flash     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async normalizeWithAi(rawCars: Record<string, any>[]): Promise<ScrapedCar[]> {
        if (!rawCars || rawCars.length === 0) return [];

        const prompt = `
Normalize the following raw car listing data into a strictly standardized JSON array.
Format each object to match this TypeScript interface:
{
    id: string,
    sourceUrl: string,
    sourcePlatform: string,
    image: string (main image URL),
    gallery: string[] (other image URLs),
    price: number (in EUR),
    title: string,
    brand: string,
    model: string,
    year: number,
    mileage: number,
    fuel: string,
    gearbox: string,
    location: string,
    country: string
}

Raw Data: ${JSON.stringify(rawCars.slice(0, 10))}

Return ONLY the raw JSON array.
        `;

        try {
            if (!model) throw new Error("AI Model not initialized (missing API key)");

            const result = await model.generateContent(prompt);
            const responseText = result.response?.text();
            if (!responseText) throw new Error("Empty AI response");

            const cleanJson = responseText.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanJson) as ScrapedCar[];
        } catch (error) {
            console.error("AI Normalization Error:", error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (rawCars || []).map((rc: Record<string, any>, i: number) => ({
                id: rc.id || `raw-${i}`,
                sourceUrl: rc.url || rc.source_url || "",
                sourcePlatform: rc.provider || rc.sourcePlatform || "Unknown",
                image: rc.images?.[0] || rc.image || "",
                gallery: rc.images?.slice(1) || [],
                price: rc.price_eur || rc.price || 0,
                title: rc.title || `${rc.brand || ""} ${rc.model || ""}`.trim() || "Unknown",
                brand: rc.brand || "Unknown",
                model: rc.model || "Unknown",
                year: rc.year || 0,
                mileage: rc.mileage || 0,
                fuel: rc.fuel || "Unknown",
                gearbox: rc.gearbox || "Unknown",
                location: rc.location || "Unknown",
                country: rc.country || "Unknown",
            })) as ScrapedCar[];
        }
    }

    async getCars(
        country: string,
        brand?: string,
        model?: string,
        minPrice?: number,
        maxPrice?: number
    ): Promise<ScrapedCar[]> {
        console.log(`[scraper] Searching: ${brand ?? "*"} ${model ?? "*"} in ${country} (€${minPrice ?? 0}–€${maxPrice ?? "∞"})`);

        if (country.toLowerCase() === "all") {
            const allCountries = ["poland", "romania", "bulgaria", "moldova"];
            const results = await Promise.all(
                allCountries.map(c => this.getCars(c, brand, model, minPrice, maxPrice))
            );
            return results.flat();
        }

        let results: ScrapedCar[] = [];
        switch (country.toLowerCase()) {
            case "poland":
                results = await this.fetchOtomoto(brand, model, minPrice, maxPrice);
                break;
            case "romania":
                results = await this.fetchAutovit(brand, model, minPrice, maxPrice);
                break;
            case "bulgaria":
                results = await this.fetchMobileBg(brand, model, minPrice, maxPrice);
                break;
            case "moldova":
                results = await this.fetch999Md(brand, model, minPrice, maxPrice);
                break;
            default:
                results = [];
        }

        return results.filter(car => {
            const matchPrice =
                (!minPrice || car.price >= minPrice) &&
                (!maxPrice || car.price <= maxPrice);
            return matchPrice;
        });
    }

    // ─── Poland — Otomoto ─────────────────────────────────────────────────────

    private async fetchOtomoto(brand?: string, model?: string, minPrice?: number, maxPrice?: number): Promise<ScrapedCar[]> {
        const slug = [brand, model]
            .filter(Boolean)
            .map(s => s!.toLowerCase().replace(/\s+/g, "-"))
            .join("/");
        const url = `https://www.otomoto.pl/osobowe${slug ? `/${slug}` : ""}`;

        try {
            const html = await stealthFetch(url);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let raw: Record<string, any>[] = this.parseOtomotoHtml(html, url);

            if (raw.length === 0) {
                console.warn("[Otomoto] Direct parse found 0 results, triggering Gemini repair");
                raw = await repairWithGemini(html, url);
            }

            const normalized = await this.normalizeWithAi(
                raw.map(r => ({ ...r, sourcePlatform: "Otomoto", country: "Poland" }))
            );
            return normalized;
        } catch (err) {
            console.error("[Otomoto] Fetch failed:", err);
            return this.fallbackMock("Otomoto", "Poland", brand, model, 6, minPrice, maxPrice);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseOtomotoHtml(html: string, baseUrl: string): Record<string, any>[] {
        const nextDataCars = this.extractCarsFromNextData(html);
        if (nextDataCars && nextDataCars.length > 0) {
            return nextDataCars;
        }

        // Otomoto renders article[data-id] cards
        const articleRe = /<article[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/gi;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: Record<string, any>[] = [];
        let m: RegExpExecArray | null;

        // Parse JSON-LD for reliable price, brand, and mileage data
        let jsonLdItems: any[] = [];
        const ldMatch = html.match(/<script id="listing-json-ld"[^>]*>([\s\S]*?)<\/script>/i);
        if (ldMatch) {
            try {
                const data = JSON.parse(ldMatch[1]);
                jsonLdItems = data?.mainEntity?.itemListElement || [];
            } catch (e) {
                console.warn("[Otomoto] Failed to parse JSON-LD", e);
            }
        }

        while ((m = articleRe.exec(html)) !== null) {
            const id = m[1];
            const block = m[2];

            const hrefMatch = block.match(/href="(https?:\/\/[^"]*otomoto[^"]+)"/i) ||
                block.match(/href="(\/oferta[^"]+)"/i);
            const imgMatch = block.match(/src="(https?:\/\/[^"]+(?:image|jpg|jpeg|webp|png)[^"]*)"/i);
            const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) ||
                block.match(/<a[^>]*class="[^"]*offer-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
            const yearMatch = block.match(/\b(20[0-2][0-9]|19[89][0-9])\b/);

            if (!hrefMatch) continue; // skip non-car blocks

            const title = titleMatch ? stripHtml(titleMatch[1]).trim() : "";

            // Try to find the matching item in JSON-LD by title
            const ldItem = jsonLdItems.find((item: any) => item?.itemOffered?.name?.trim() === title);

            let price = 0;
            let mileage = 0;
            let brand = "Unknown";
            let fuel = "Unknown";

            if (ldItem?.priceSpecification?.price) {
                price = parseFloat(ldItem.priceSpecification.price);
            } else {
                const priceMatch = block.match(/data-price-eur="([\d.]+)"/i) || block.match(/(\d[\d\s]{2,8})\s*(?:EUR|PLN|zł)/i);
                price = priceMatch ? extractNumber(priceMatch[1]) : 0;
            }

            if (ldItem?.itemOffered?.mileageFromOdometer?.value) {
                mileage = parseInt(ldItem.itemOffered.mileageFromOdometer.value, 10);
            } else {
                // Warning: "KM" in Polish can mean Horsepower (Konie Mechaniczne), not strictly kilometers.
                const mileMatch = block.match(/([\d\s]{3,9})\s*km/i);
                mileage = mileMatch ? extractNumber(mileMatch[1]) : 0;
            }

            if (ldItem?.itemOffered?.brand) brand = ldItem.itemOffered.brand;
            if (ldItem?.itemOffered?.fuelType) fuel = ldItem.itemOffered.fuelType;

            results.push({
                id: `oto-${id}`,
                url: hrefMatch[1].startsWith("http") ? hrefMatch[1] : `https://www.otomoto.pl${hrefMatch[1]}`,
                price,
                image: imgMatch?.[1] ?? "",
                title,
                year: yearMatch ? parseInt(yearMatch[1], 10) : 0,
                mileage,
                brand,
                fuel
            });
        }

        return results;
    }

    // ─── Romania — Autovit ────────────────────────────────────────────────────

    private async fetchAutovit(brand?: string, model?: string, minPrice?: number, maxPrice?: number): Promise<ScrapedCar[]> {
        const b = brand?.toLowerCase().replace(/\s+/g, "-") ?? "";
        const m = model?.toLowerCase().replace(/\s+/g, "-") ?? "";
        const path = [b, m].filter(Boolean).join("/");
        const url = `https://www.autovit.ro/autoturisme${path ? `/${path}` : ""}`;

        try {
            const html = await stealthFetch(url);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let raw: Record<string, any>[] = this.parseAutovitHtml(html, url);

            if (raw.length === 0) {
                raw = await repairWithGemini(html, url);
            }

            const normalized = await this.normalizeWithAi(
                raw.map(r => ({ ...r, sourcePlatform: "Autovit", country: "Romania" }))
            );
            return normalized;
        } catch (err) {
            console.error("[Autovit] Fetch failed:", err);
            return this.fallbackMock("Autovit", "Romania", brand, model, 7, minPrice, maxPrice);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseAutovitHtml(html: string, baseUrl: string): Record<string, any>[] {
        const nextDataCars = this.extractCarsFromNextData(html);
        if (nextDataCars && nextDataCars.length > 0) {
            return nextDataCars;
        }

        // Autovit shares the same UI engine as Otomoto
        const articleRe = /<article[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/gi;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: Record<string, any>[] = [];
        let m: RegExpExecArray | null;

        // Parse JSON-LD for reliable price, brand, and mileage data
        let jsonLdItems: any[] = [];
        const ldMatch = html.match(/<script id="listing-json-ld"[^>]*>([\s\S]*?)<\/script>/i);
        if (ldMatch) {
            try {
                const data = JSON.parse(ldMatch[1]);
                jsonLdItems = data?.mainEntity?.itemListElement || [];
            } catch (e) {
                console.warn("[Autovit] Failed to parse JSON-LD", e);
            }
        }

        while ((m = articleRe.exec(html)) !== null) {
            const id = m[1];
            const block = m[2];

            const hrefMatch = block.match(/href="(https?:\/\/[^"]*autovit[^"]+)"/i) ||
                block.match(/href="(\/anunt[^"]+)"/i);
            const imgMatch = block.match(/src="(https?:\/\/[^"]+(?:image|jpg|jpeg|webp|png)[^"]*)"/i);
            const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) ||
                block.match(/<a[^>]*class="[^"]*offer-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
            const yearMatch = block.match(/\b(20[0-2][0-9]|19[89][0-9])\b/);

            if (!hrefMatch) continue; // skip non-car blocks

            const title = titleMatch ? stripHtml(titleMatch[1]).trim() : "";

            // Try to find the matching item in JSON-LD by title
            const ldItem = jsonLdItems.find((item: any) => item?.itemOffered?.name?.trim() === title);

            let price = 0;
            let mileage = 0;
            let brand = "Unknown";
            let fuel = "Unknown";

            if (ldItem?.priceSpecification?.price) {
                price = parseFloat(ldItem.priceSpecification.price);
            } else {
                const priceMatch = block.match(/data-price-eur="([\d.]+)"/i) || block.match(/(\d[\d\s]{2,8})\s*(?:EUR|RON|€)/i);
                price = priceMatch ? extractNumber(priceMatch[1]) : 0;
            }

            if (ldItem?.itemOffered?.mileageFromOdometer?.value) {
                mileage = parseInt(ldItem.itemOffered.mileageFromOdometer.value, 10);
            } else {
                const mileMatch = block.match(/([\d\s]{3,9})\s*km/i);
                mileage = mileMatch ? extractNumber(mileMatch[1]) : 0;
            }

            if (ldItem?.itemOffered?.brand) brand = ldItem.itemOffered.brand;
            if (ldItem?.itemOffered?.fuelType) fuel = ldItem.itemOffered.fuelType;

            results.push({
                id: `avit-${id}`,
                url: hrefMatch[1].startsWith("http") ? hrefMatch[1] : `https://www.autovit.ro${hrefMatch[1]}`,
                price,
                image: imgMatch?.[1] ?? "",
                title,
                year: yearMatch ? parseInt(yearMatch[1], 10) : 0,
                mileage,
                brand,
                fuel
            });
        }

        return results;
    }

    // ─── Bulgaria — Mobile.bg ─────────────────────────────────────────────────

    private async fetchMobileBg(brand?: string, model?: string, minPrice?: number, maxPrice?: number): Promise<ScrapedCar[]> {
        const b = encodeURIComponent(brand ?? "");
        const m = encodeURIComponent(model ?? "");
        const url = `https://www.mobile.bg/pcgi/mobile.cgi?act=3&slink=cars&f10=${b}&f11=${m}`;

        try {
            const html = await stealthFetch(url);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let raw: Record<string, any>[] = this.parseMobileBgHtml(html, url);

            if (raw.length === 0) {
                raw = await repairWithGemini(html, url);
            }

            const normalized = await this.normalizeWithAi(
                raw.map(r => ({ ...r, sourcePlatform: "Mobile.bg", country: "Bulgaria" }))
            );
            return normalized;
        } catch (err) {
            console.error("[Mobile.bg] Fetch failed:", err);
            return this.fallbackMock("Mobile.bg", "Bulgaria", brand, model, 5, minPrice, maxPrice);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseMobileBgHtml(html: string, baseUrl: string): Record<string, any>[] {
        // Mobile.bg uses div containers for photo/wrapper
        const itemRe = /<div class="photo">([\s\S]*?)<\/div>\s*<div class="text">/gi;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: Record<string, any>[] = [];
        let m: RegExpExecArray | null;

        while ((m = itemRe.exec(html)) !== null) {
            const block = m[1];

            // Extract link and title from div.big
            const linkMatch = block.match(/<div class="big">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
            const href = linkMatch ? linkMatch[1] : "";
            const title = linkMatch ? stripHtml(linkMatch[2]).trim() : "";

            // Extract price from div.price
            const priceMatch = block.match(/<div class="price\s*">([\s\S]*?)<\/div>/i);
            let priceText = "";
            let price = 0;
            if (priceMatch) {
                // Get the first part before <br> (usually EUR/€ or BGN/лв)
                const parts = priceMatch[1].split(/<br\s*\/?>/i);
                priceText = stripHtml(parts[0]).trim();
                price = extractNumber(priceText);
            }

            // Extract image
            const imgMatch = block.match(/src="([^"]+\.(?:jpg|jpeg|webp|png)[^"]*)"/i);

            // Extract additional info from the "text" block which follows the photo block
            // In our simple itemRe, we only captured the "photo" div block. 
            // Mobile.bg is a bit tricky as the metadata is in a sibling div.

            if (!href && !price) continue;

            results.push({
                id: `mbg-${Math.random().toString(36).slice(2, 8)}`,
                url: href.startsWith("http") ? href : `https:${href}`,
                price: price,
                image: imgMatch ? (imgMatch[1].startsWith("http") ? imgMatch[1] : `https:${imgMatch[1]}`) : "",
                title,
                year: 0, // Hard to extract without complex relative parsing
                mileage: 0,
            });
        }

        return results;
    }

    // ─── Moldova — 999.md ─────────────────────────────────────────────────────

    private async fetch999Md(brand?: string, model?: string, minPrice?: number, maxPrice?: number): Promise<ScrapedCar[]> {
        const params = new URLSearchParams({
            applied_filter_origin: "url",
            ...(brand && { "f[brand][0]": brand }),
            ...(model && { "f[model][0]": model }),
        });
        const url = `https://999.md/ro/list/transport/cars?${params.toString()}`;

        try {
            const html = await stealthFetch(url);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let raw: Record<string, any>[] = this.parse999MdHtml(html, url);

            if (raw.length === 0) {
                raw = await repairWithGemini(html, url);
            }

            const normalized = await this.normalizeWithAi(
                raw.map(r => ({ ...r, sourcePlatform: "999.md", country: "Moldova" }))
            );
            return normalized;
        } catch (err) {
            console.error("[999.md] Fetch failed:", err);
            return this.fallbackMock("999.md", "Moldova", brand, model, 8, minPrice, maxPrice);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parse999MdHtml(html: string, baseUrl: string): Record<string, any>[] {
        // 999.md uses various classes for ads-list items
        const itemRe = /<li[^>]*class="[^"]*ads-list-photo-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: Record<string, any>[] = [];
        let m: RegExpExecArray | null;

        while ((m = itemRe.exec(html)) !== null) {
            const block = m[1];
            const hrefMatch = block.match(/href="(\/ro\/[0-9]+)"/i);
            const priceMatch = block.match(/([\d\s]+)\s*(?:€|EUR|lei|MDL)/i);
            const imgMatch = block.match(/src="([^"]+\.(?:jpg|jpeg|webp|png)[^"]*)"/i);
            const titleMatch = block.match(/title="([^"]+)"/i) ||
                block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);

            if (!hrefMatch) continue;

            results.push({
                id: `999-${Math.random().toString(36).slice(2, 8)}`,
                url: `https://999.md${hrefMatch[1]}`,
                price: priceMatch ? extractNumber(priceMatch[1]) : 0,
                image: imgMatch ? (imgMatch[1].startsWith("http") ? imgMatch[1] : `https:${imgMatch[1]}`) : "",
                title: titleMatch ? stripHtml(titleMatch[1]).trim() : "",
                year: 0,
                mileage: 0,
            });
        }

        return results;
    }

    // ─── Fallback mock (used only on hard fetch failure) ────────────────────

    private fallbackMock(
        platform: string,
        country: string,
        brand?: string,
        model?: string,
        count = 5,
        minPrice?: number,
        maxPrice?: number
    ): ScrapedCar[] {
        console.warn(`[${platform}] Using fallback mock data — real fetch failed`);
        const IMAGES: Record<string, string> = {
            "Otomoto": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800",
            "Autovit": "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&q=80&w=800",
            "Mobile.bg": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800",
            "999.md": "https://images.unsplash.com/photo-1590362891175-3794ac1b88c3?auto=format&fit=crop&q=80&w=800",
        };
        const prefix = platform.replace(/[^a-z]/gi, "").slice(0, 3).toLowerCase();

        // Adjust price to be within filter range if possible
        const basePrice = maxPrice ? Math.max(minPrice || 0, maxPrice - 5000) : (minPrice || 15000);
        const priceStep = maxPrice ? (maxPrice - basePrice) / count : 1000;

        return Array.from({ length: count }).map((_, i) => ({
            id: `${prefix}-mock-${i}`,
            title: `${brand ?? "Car"} ${model ?? ""} (Mock)`,
            brand: brand ?? "Unknown",
            model: model ?? "Unknown",
            year: 2018 + i,
            price: Math.floor(basePrice + i * priceStep),
            mileage: 40000 + i * 5000,
            fuel: "Diesel",
            gearbox: "Automatic",
            image: IMAGES[platform] ?? "",
            gallery: [],
            sourceUrl: `https://example.com/listing/${i}`,
            sourcePlatform: platform,
            location: country,
            country,
        })) as ScrapedCar[];
    }
}

export const scraper = new ScraperEngine();
