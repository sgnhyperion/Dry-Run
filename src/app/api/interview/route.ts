import { askBrain } from "@/lib/brain";

export async function GET() {
   const question = "Ask me a technical question about voice modeling and speech synthesis, and I will answer it.";
   const { text } = await askBrain(question, undefined);

   return Response.json({ text });
}

export async function POST(request: Request){
    const { message, previousId } = await request.json();
    const result = await askBrain(message, previousId);
    console.log("askBrain returned:", result);

    return Response.json({ text: result.text, id: result.id });
}