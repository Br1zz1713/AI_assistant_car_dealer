/**
 * fetcher.ts — Stealth HTTP fetcher for anti-bot bypass
 *
 * Strategy:
 *   SCRAPER_STRATEGY=direct (default) → stealth headers + random delay + retry
 *   SCRAPER_STRATEGY=proxy            → routes via ScraperAPI (needs SCRAPER_API_KEY)
 */

import { model } from "./gemini";

// ─── User-Agent Pool ────────────────────────────────────────────────────────

const USER_AGENTS = [
    // Chrome Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    // Chrome Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // Chrome Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // Firefox Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    // Firefox Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:121.0) Gecko/20100101 Firefox/121.0",
    // Firefox Linux
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    // Safari Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    // Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    // Mobile Chrome Android
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
    // Mobile Safari iOS
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
];

const ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    "ro-RO,ro;q=0.9,en;q=0.8",
    "bg-BG,bg;q=0.9,en;q=0.8",
    "ru-RU,ru;q=0.9,en;q=0.5",
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildStealthHeaders(): Record<string, string> {
    const ua = pickRandom(USER_AGENTS);
    const isFirefox = ua.includes("Firefox");
    const isChrome = ua.includes("Chrome") && !ua.includes("Edg");

    return {
        "User-Agent": ua,
        "Accept": isFirefox
            ? "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
            : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": pickRandom(ACCEPT_LANGUAGES),
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        ...(isChrome && {
            "Sec-CH-UA": `"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"`,
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Platform": '"Windows"',
        }),
    };
}

// ─── Delay ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function randomDelay(): Promise<void> {
    const ms = 1000 + Math.random() * 3000; // 1–4s
    return delay(ms) as Promise<void>;
}

// ─── ScraperAPI proxy ────────────────────────────────────────────────────────

function wrapWithProxy(targetUrl: string): string {
    const apiKey = process.env.SCRAPER_API_KEY;
    if (!apiKey) throw new Error("SCRAPER_API_KEY not set");
    const encoded = encodeURIComponent(targetUrl);
    return `https://api.scraperapi.com?api_key=${apiKey}&url=${encoded}&render=true`;
}

// ─── Core fetch ─────────────────────────────────────────────────────────────

/**
 * Fetches a URL with stealth headers, optional proxy, and retry logic.
 * Returns the raw HTML string, or throws after MAX_RETRIES attempts.
 */
export async function stealthFetch(
    url: string,
    options: { maxRetries?: number; useProxy?: boolean } = {}
): Promise<string> {
    const strategy = process.env.SCRAPER_STRATEGY ?? "direct";
    const useProxy = options.useProxy ?? strategy === "proxy";
    const maxRetries = options.maxRetries ?? 3;

    const fetchUrl = useProxy ? wrapWithProxy(url) : url;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await randomDelay();

            const headers = useProxy
                ? {} // ScraperAPI adds its own headers
                : buildStealthHeaders();

            console.log(`[stealthFetch] Attempt ${attempt}/${maxRetries}: ${fetchUrl.slice(0, 80)}...`);

            const res = await fetch(fetchUrl, {
                headers,
                redirect: "follow",
                signal: AbortSignal.timeout(30_000),
            });

            console.log(`[stealthFetch] ${res.status} ${res.statusText} from ${fetchUrl.slice(0, 50)}...`);

            if (res.status === 403 || res.status === 401) {
                console.warn(`[stealthFetch] Blocked (${res.status}) on attempt ${attempt}`);
                if (attempt < maxRetries) {
                    await delay(2000 * attempt); // exponential backoff
                    continue;
                }
                throw new Error(`Blocked: HTTP ${res.status} after ${maxRetries} attempts`);
            }

            if (!res.ok) {
                throw new Error(`HTTP ${res.status} from ${url}`);
            }

            const html = await res.text();

            if (!html || html.trim().length < 500) {
                console.warn(`[stealthFetch] Empty/tiny HTML on attempt ${attempt} (${html.length}b)`);
                if (attempt < maxRetries) continue;
                return html; // Let caller decide (triggers Gemini repair)
            }

            return html;
        } catch (err) {
            console.error(`[stealthFetch] Error on attempt ${attempt}:`, err);
            if (attempt === maxRetries) throw err;
            await delay(2000 * attempt);
        }
    }

    return ""; // Should not reach here
}

// ─── Gemini HTML Repair ──────────────────────────────────────────────────────

/**
 * Sends a raw HTML snippet to Gemini 1.5 Flash to extract car listings.
 * Used as a fallback when HTML parsing returns 0 results.
 */
export async function repairWithGemini(
    html: string,
    sourceUrl: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
    console.log(`[Gemini Repair] triggered for ${sourceUrl}`);

    // Trim HTML to avoid token limits (keep first ~15k chars which usually has the listings)
    const snippet = html.slice(0, 15000);

    const prompt = `
You are a web scraping assistant. Extract ALL car listings from the following HTML.
Return a JSON array where each object has these fields (use null if not found):
{
  "price": number (in EUR or local currency),
  "brand": string,
  "model": string,
  "year": number,
  "mileage": number (in km),
  "fuel": string,
  "gearbox": string,
  "location": string,
  "url": string (listing href, make absolute if relative using base: ${sourceUrl}),
  "image": string (main image src)
}

HTML:
${snippet}

Return ONLY the raw JSON array, no explanation, no markdown fences.
    `.trim();

    try {
        if (!model) throw new Error("AI Model not initialized (missing API key)");
        const result = await model.generateContent(prompt);
        const text = result.response?.text() ?? "";
        const clean = text.replace(/```json|```/g, "").trim();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.parse(clean) as Record<string, any>[];
    } catch (err) {
        console.error("[Gemini Repair] Failed:", err);
        return [];
    }
}
