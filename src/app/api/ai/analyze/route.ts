import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

export async function POST(request: Request) {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
        return NextResponse.json({ error: "AI Service Unavailable (Missing Key)" }, { status: 503 });
    }

    try {
        const { title, specs, description, targetLang = "English" } = await responseToJSON(request);

        if (!title || !description) {
            return NextResponse.json({ error: "Missing car details for analysis" }, { status: 400 });
        }

        const systemInstruction = `
            You are an expert European car market analyst. 
            Analyze the provided car listing data and return a JSON object.
            
            TASKS:
            1. Translate the 'description' into ${targetLang}. Keep the tone professional but descriptive.
            2. Generate a list of 'pros' and 'cons' specifically for this car model and year (e.g., mention known technical reliability, engine issues, or market desirability).
            3. Provide a 'dealRating': 'Great Deal', 'Good Deal', 'Fair Price', or 'Overpriced' based on typical EU market values for similar specs.
            
            JSON FORMAT:
            {
                "translatedDescription": "...",
                "pros": ["...", "..."],
                "cons": ["...", "..."],
                "dealRating": "..."
            }
            
            Return ONLY the raw JSON. Do not include markdown formatting or extra text.
        `;

        const userPrompt = `
            Title: ${title}
            Specs: ${JSON.stringify(specs)}
            Original Description: ${description}
        `;

        const result = await model.generateContent([
            { text: systemInstruction },
            { text: userPrompt }
        ]);

        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanJson);

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json({
            translatedDescription: "Original description unavailable at this time.",
            pros: ["Standard model features"],
            cons: ["Technical check recommended"],
            dealRating: "Fair Price"
        });
    }
}

async function responseToJSON(request: Request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}
