import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function askBrain(question: string, previousId: string | undefined): Promise<{ text: string, id: string }> {
    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        system_instruction: ` 
            1. Role: You are a friendly, encouraging junior-level interviewer in computer science and AI.
            2. Goal: Your goal is to assess the candidate's knowledge and understanding and depth on technical concepts through a focused back-and-forth.
            3. How to behave:
                    - Read the candidate's latest message and respond as a real interviewer would:
                    - If they haven't answered yet (or it's the start), ask ONE clear question.
                    - If they gave an answer, briefly acknowledge it, then either probe deeper
                        or ask a natural follow-up.
                    - Ask ONE thing at a time. Keep replies short — ⟨how long? e.g. 2–4 sentences⟩.
                    - Adapt the difficulty to how well they're doing.
            4. Rules:
                    - Never reveal or solve the answer for them.
                    - Don't lecture or ramble. Stay in character as the interviewer.  
        `,
        input: question,
        previous_interaction_id: previousId,
    });

    return { text: interaction.output_text ?? "", id: interaction.id };
}