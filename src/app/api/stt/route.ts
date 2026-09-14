import { speechToText } from "@/lib/ears";

export async function POST(request: Request) {
    const audio = await request.arrayBuffer();

    if (audio.byteLength === 0) {
        return Response.json({ error: "No audio received" }, { status: 400 });
    }

    // Pass the browser's own container type through — Chrome sends webm/opus, Safari mp4.
    const mimeType = request.headers.get("content-type") ?? "audio/webm";

    try {
        const text = await speechToText(audio, mimeType);
        return Response.json({ text });
    } catch (error) {
        // Fail loud with the real reason. Silently returning "" here would look like
        // "you said nothing" instead of "the STT server is down" — the exact confusion
        // the seam is supposed to prevent.
        console.error("STT route failed:", error);
        const message = error instanceof Error ? error.message : "Transcription failed";
        return Response.json({ error: message }, { status: 500 });
    }
}
