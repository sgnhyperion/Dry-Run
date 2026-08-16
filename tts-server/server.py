from fastapi import FastAPI, Response
from pydantic import BaseModel
from kokoro import KPipeline
import soundfile as sf
import numpy as np
import io

app = FastAPI()
pipeline = KPipeline(lang_code='a')
SAMPLE_RATE = 24000

class TTSRequest(BaseModel):
    text: str

@app.post("/tts")
def tts(req: TTSRequest):

    buf = io.BytesIO()
    text = req.text
    audio_data = pipeline(text, voice='af_heart')

    chunks = []
    for i, (grphemes, phonemes, audio) in enumerate(audio_data):
        chunks.append(audio)
    
    full = np.concatenate(chunks)
    # Convert the audio to WAV format in memory
    sf.write(buf, full, SAMPLE_RATE, format="WAV")
    buf.seek(0)
    return Response(content=buf.read(), media_type="audio/wav")

