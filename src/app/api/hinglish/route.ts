import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const prompt = `
You are a Hinglish normalization engine.

Rules:
- Convert Hindi words written in English letters into proper Hindi (Devanagari).
- Keep English words as English.
- Preserve emotion, slang, and tone.
- Do NOT translate everything to English.
- Do NOT remove informal style.

Input:
"${text}"

Output:
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const normalizedText = response.text || text;

    return NextResponse.json({ normalizedText });
  } catch (error) {
    console.error("Gemini error:", error);

    return NextResponse.json(
      { normalizedText: null, error: "Failed to normalize text" },
      { status: 500 }
    );
  }
}