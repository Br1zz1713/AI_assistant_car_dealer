# Environment Variables Guide

This project requires several environment variables to function correctly. These should be defined in a `.env.local` file in the root of the project for local development.

## Required Variables

### Supabase (Database & Authentication)
Supabase provides the backend infrastructure for the car listings and user accounts.

- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL (e.g., `https://xyz.supabase.co`).
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase project's anonymous public key.

> [!CAUTION]
> If `NEXT_PUBLIC_SUPABASE_URL` is set to the placeholder `your-project-url.supabase.co`, real-time features and WebSocket connections will fail with `net::ERR_NAME_NOT_RESOLVED`. Ensure this is updated to your actual Supabase URL.

> [!NOTE]
> You can find these in your Supabase Dashboard under **Project Settings > API**.

### Google Gemini AI
Gemini 1.5 Flash powers the AI semantic search, recommendations, and car insights.

- **`GOOGLE_GEMINI_API_KEY`**: Your Google AI Studio API key.

> [!TIP]
> Get your API key for free at [Google AI Studio](https://aistudio.google.com/).

## Production Setup (Vercel)
When deploying to Vercel, you must add these variables in the **Project Settings > Environment Variables** section.

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase Anon Key |
| `GOOGLE_GEMINI_API_KEY` | Production, Preview, Development | Gemini API Key |
| `SCRAPER_STRATEGY` | Production, Preview, Development | `direct` (default) or `proxy` |
| `SCRAPER_API_KEY` | Production, Preview, Development | ScraperAPI key (only if `proxy`) |

## Example `.env.local`
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Google Gemini
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Scraper Strategy
# "direct" = stealth headers + rotate UA (free, default)
# "proxy"  = route via ScraperAPI — handles JS-heavy SPAs (needs SCRAPER_API_KEY)
SCRAPER_STRATEGY=direct
# SCRAPER_API_KEY=your_scraperapi_key_here  # get free key: https://scraperapi.com
```
