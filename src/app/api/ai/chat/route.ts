import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { mockCars } from "@/lib/mockData";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: Request) {
    try {
        const { messages, currentCarId } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const currentCar = currentCarId ? mockCars.find(c => c.id === currentCarId) : null;

        // Construct the context for Gemini
        let context = "You are an expert car buying assistant for the European market. ";
        if (currentCar) {
            context += `The user is currently looking at: ${currentCar.brand} ${currentCar.model} (${currentCar.year}, ${currentCar.fuel}, €${currentCar.price_eur}). `;
        }
        context += "Provide helpful, concise, and expert advice. Support your claims with technical reasoning.";

        if (!model) throw new Error("AI Model not initialized (missing API key)");

        const history = messages.map((msg: Message) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: history.slice(0, -1), // Everything except the latest user message
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const latestMessage = messages[messages.length - 1].content;
        const fullPrompt = `${context}\n\nUser: ${latestMessage}`;

        const result = await chat.sendMessage(fullPrompt);
        const responseText = result.response.text();

        return NextResponse.json({ content: responseText });
    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({
            content: "I'm sorry, I'm having trouble connecting to my automotive knowledge base right now. However, I can still help you with standard car specifications or market advice. Please try again in a moment!"
        });
    }
}
