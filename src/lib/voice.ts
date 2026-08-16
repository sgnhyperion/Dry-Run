import {GoogleGenAI} from '@google/genai';

export async function textToSpeech(text: string) {
   const client = new GoogleGenAI({});

   try {
        const interaction = await client.interactions.create({
        model: "gemini-3.1-flash-tts-preview",
        input: text,
        response_format: { type: 'audio' },
        generation_config: {
            speech_config: [
                { voice: 'Kore' }
            ]
        },
        });

        if (!interaction?.output_audio?.data) {
            throw new Error("No audio data returned from TTS model");
        }

        const audioBuffer = Buffer.from(interaction?.output_audio?.data, 'base64');

        const wavBuffer = pcmToWav(audioBuffer);

        return wavBuffer;
   } catch (error) {
        console.error("Error in textToSpeech:", error);
        return new Response("Error generating speech", { status: 500 });
   }
}

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
    const byteRate = (sampleRate * channels * bitsPerSample) / 8;
    const blockAlign = (channels * bitsPerSample) / 8;
    const h = Buffer.alloc(44);
    h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
    h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
    h.writeUInt16LE(channels, 22); h.writeUInt32LE(sampleRate, 24);
    h.writeUInt32LE(byteRate, 28); h.writeUInt16LE(blockAlign, 32);
    h.writeUInt16LE(bitsPerSample, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([h, pcm]);
}