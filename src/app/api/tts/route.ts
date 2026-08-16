import { textToSpeech } from "@/lib/voice";

export async function POST(request: Request) {
    const { text } = await request.json();
    const wavBuffer = await textToSpeech(text);
    
    if (wavBuffer instanceof Response) {
        return wavBuffer;
    }
    return new Response(new Uint8Array(wavBuffer), {
        headers: { "Content-Type": "audio/wav" }
    });
}