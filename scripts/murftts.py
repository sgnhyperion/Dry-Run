from flask import Flask, request, jsonify
import requests
import os
import re
from dotenv import load_dotenv

app = Flask(__name__)

# ---------------- ENV + DIR SETUP ----------------
load_dotenv()
MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_API_URL = "https://api.murf.ai/v1/speech/generate"
AUDIO_DIR = "D:/chat-avatar-app/public/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# ---------------- VOICE CONFIG ----------------
DEFAULT_VOICES = {
    "male": "hi-IN-shaan",
    "female": "hi-IN-shweta"
}

VOICE_EMOTIONS = {
    "hi-IN-amit": ["Conversational"],
    "hi-IN-ayushi": ["Conversational"],
    "hi-IN-shaan": ["Conversational", "Calm", "Promo", "Sad"],
    "hi-IN-shweta": ["Conversational", "Calm", "Promo", "Sad"]
}

# ---------------- SMART PUNCTUATION FIXER ----------------
def fix_punctuation(text: str) -> str:
    """
    Lightweight heuristic punctuation fixer for English + Hinglish/Hindi chat text.
    Adds question marks, exclamation marks, commas, and periods smartly.
    """
    import re
    text = text.strip()

    # Capitalize start
    if text:
        text = text[0].upper() + text[1:]

    # ✅ Add comma after common greeting phrases
    greeting_phrases = [
        "aur bhai", "are bhai", "arre bhai", "arre yaar", "are yaar",
        "oye", "bro", "bhai", "abe", "arre"
    ]
    lower = text.lower()
    for phrase in greeting_phrases:
        if lower.startswith(phrase + " "):
            idx = len(phrase)
            text = text[:idx] + ", " + text[idx+1:]
            break

    # Split long lines at likely pause points
    # Comma pauses after "aur", "but", "lekin", "because", etc.
    text = re.sub(r'\b(a?ur|but|lekin|because|kyunki)\b', r', \1', text, flags=re.IGNORECASE)

    # Fix multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Add question marks for interrogatives
    question_words = r'\b(kya|kaise|kyu|kyon|why|what|how|who|when|kab|where)\b'
    if re.search(question_words, text, flags=re.IGNORECASE):
        text = text.rstrip('.!?') + '?'
    elif re.search(r'\b(wow|amazing|wah|awesome|great|shabash|nice|fantastic|excellent)\b', text, re.IGNORECASE):
        text = text.rstrip('.!?') + '!'
    else:
        # Add period if none
        if not text.endswith(('.', '?', '!')):
            text += '.'

    # Clean spacing before punctuation
    text = re.sub(r'\s+([,.!?])', r'\1', text)

    return text


# ---------------- TTS ROUTE ----------------
@app.route("/generate-tts", methods=["POST"])
def generate_tts():
    data = request.get_json(force=True)
    text = data.get("text", "Hello world")
    filename = data.get("filename", "output.wav")
    gender = data.get("gender", "male").lower()
    requested_emotion = data.get("setemotion", "Conversational").capitalize()

    # --- Apply punctuation fixing ---
    fixed_text = fix_punctuation(text)
    print(f"🧠 Fixed punctuation: '{fixed_text}'")

    voice_id = DEFAULT_VOICES.get(gender, DEFAULT_VOICES["male"])
    supported_emotions = VOICE_EMOTIONS.get(voice_id, ["Conversational"])

    if requested_emotion not in supported_emotions:
        print(f"⚠️ Requested emotion '{requested_emotion}' not supported for {voice_id}, defaulting to 'Conversational'")
        requested_emotion = "Conversational"

    print("🔥 Generating TTS for:", fixed_text, filename, gender, voice_id, requested_emotion)

    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": fixed_text,
        "voiceId": voice_id,
        "format": "WAV",
        "style": requested_emotion
    }

    try:
        response = requests.post(MURF_API_URL, json=payload, headers=headers)
        print("📡 Murf API status:", response.status_code)
        print("📡 Murf API response:", response.text)
        response.raise_for_status()

        audio_url = response.json().get("audioFile")
        if not audio_url:
            return jsonify({"success": False, "error": "No audio URL returned"}), 500

        audio_data = requests.get(audio_url)
        audio_data.raise_for_status()

        file_path = os.path.join(AUDIO_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(audio_data.content)

        print("✅ Saved WAV at:", file_path)
        return jsonify({"success": True, "audioPath": f"/audio/{filename}"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)


# from flask import Flask, request, jsonify
# import requests
# import os
# from dotenv import load_dotenv

# app = Flask(__name__)

# load_dotenv()
# MURF_API_KEY = os.getenv("MURF_API_KEY")  # or paste directly
# MURF_API_URL = "https://api.murf.ai/v1/speech/generate"
# AUDIO_DIR = "D:/chat-avatar-app/public/audio"
# os.makedirs(AUDIO_DIR, exist_ok=True)

# DEFAULT_VOICES = {
#     # "male": "hi-IN-amit",
#     # "female": "hi-IN-ayushi"
#     "male": "hi-IN-shaan",
#     "female": "hi-IN-shweta"
# }

# # Supported emotions/styles for each voice
# # For Hindi voices, Murf supports very limited styles
# VOICE_EMOTIONS = {
#     "hi-IN-amit": ["Conversational"],  # Amit supports only Conversational
#     "hi-IN-ayushi": ["Conversational"],  # Ayushi supports only Conversational
#     "hi-IN-shaan": ["Conversational", "Calm", "Promo", "Sad"],
#     "hi-IN-shweta": ["Conversational", "Calm", "Promo", "Sad"]
# }

# @app.route("/generate-tts", methods=["POST"])
# def generate_tts():
#     data = request.get_json(force=True)
#     text = data.get("text", "Hello world")
#     filename = data.get("filename", "output.wav")
#     gender = data.get("gender", "male").lower()
#     requested_emotion = data.get("setemotion", "Conversational").capitalize()

#     voice_id = DEFAULT_VOICES.get(gender, DEFAULT_VOICES["male"])
#     supported_emotions = VOICE_EMOTIONS.get(voice_id, ["Conversational"])

#     # Validate the requested emotion
#     if requested_emotion not in supported_emotions:
#         print(f"⚠️ Requested emotion '{requested_emotion}' not supported for {voice_id}, defaulting to 'Conversational'")
#         requested_emotion = "Conversational"

#     print("🔥 Generating TTS for:", text, filename, gender, voice_id, requested_emotion)

#     headers = {
#         "api-key": MURF_API_KEY,
#         "Content-Type": "application/json"
#     }

#     payload = {
#         "text": text,
#         "voiceId": voice_id,
#         "format": "WAV",
#         "style": requested_emotion  # add validated emotion here
#     }

#     try:
#         response = requests.post(MURF_API_URL, json=payload, headers=headers)
#         print("📡 Murf API status:", response.status_code)
#         print("📡 Murf API response:", response.text)
#         response.raise_for_status()

#         audio_url = response.json().get("audioFile")
#         if not audio_url:
#             return jsonify({"success": False, "error": "No audio URL returned"}), 500

#         # Download the WAV file
#         audio_data = requests.get(audio_url)
#         audio_data.raise_for_status()

#         file_path = os.path.join(AUDIO_DIR, filename)
#         with open(file_path, "wb") as f:
#             f.write(audio_data.content)

#         print("✅ Saved WAV at:", file_path)
#         return jsonify({"success": True, "audioPath": f"/audio/{filename}"})

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return jsonify({"success": False, "error": str(e)}), 500


# if __name__ == "__main__":
#     app.run(debug=True, port=5001)
