from flask import Flask, request, jsonify
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
import os
from pydub import AudioSegment
from pydub.playback import play


# 🔧 SPEED CONTROL FUNCTION (place it here)
def change_audio_speed(sound, speed=1.0):
    # Changing the frame rate to slow down or speed up
    new_frame_rate = int(sound.frame_rate * speed)
    slowed_sound = sound._spawn(sound.raw_data, overrides={
        "frame_rate": new_frame_rate
    })
    return slowed_sound.set_frame_rate(sound.frame_rate)  # Maintain output rate
app = Flask(__name__)

# Load API key from .env
load_dotenv()
api_key = os.getenv("ELEVENLABS_API_KEY")

# Initialize ElevenLabs client
client = ElevenLabs(api_key=api_key)

# Audio save directory
AUDIO_DIR = "D:/chat-avatar-app/public/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Default voices by gender (you can customize these IDs)
DEFAULT_VOICES = {
    # "male": "pNInz6obpgDQGcFmaJgB",  # Example: Adam
    # "male": "4BoDaQ6aygOP6fpsUmJe",
    # "male": "z2Roi4cV9Mq5RoyiyVk7",  #ishowspeed
    # "male": "HobRzuqtLputbKAXOdTj", # harsh
    "male": "oTX9cmwanAcGPFEDZy5Z", #rajuu
    # "female": "21m00Tcm4TlvDq8ikWAM"    # Example: Rachel
    "female": "jUjRbhZWoMK4aDciW36V"
}

@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    # data = request.json
    # text = data.get('text')
    # filename = data.get('filename')
    # gender = data.get('gender', 'male').lower()  # Default to male
    # requested_emotion = data.get("setemotion", "Conversational").capitalize()

    # if not text or not filename:
    #     return jsonify({"success": False, "error": "Text and filename are required"}), 400

    # try:
    #     # Select voice ID by gender
    #     voice_id = DEFAULT_VOICES.get(gender, DEFAULT_VOICES["male"])

    #     # Generate audio
    #     audio_generator = client.text_to_speech.convert(
    #         text=text,
    #         voice_id=voice_id,
    #         # model_id="eleven_multilingual_v2",
    #         model_id="eleven_v3",
    #         output_format="mp3_44100_128"  # Free tier-compatible
    #     )
    data = request.json
    text = data.get('text')
    filename = data.get('filename')
    gender = data.get('gender', 'male').lower()
    requested_emotion = data.get("setemotion", "Conversational").lower() # Use .lower()
    avatar_model = data.get('avatarmodel')

    if not text or not filename:
        return jsonify({"success": False, "error": "Text and filename are required"}), 400

    try:
        # Select voice ID by gender
        voice_id = DEFAULT_VOICES.get(gender, DEFAULT_VOICES["male"])
        
        if avatar_model == "ishowspeed.usd":
            voice_id = "z2Roi4cV9Mq5RoyiyVk7"
            print(f"🔥 Speed model detected! Using voice_id: {voice_id}")

        if avatar_model == "batman.usd":
            voice_id = "HAXOqRTRwKKf5TdT2qyA"
            print(f"🔥 batman model detected! Using voice_id: {voice_id}")

        if avatar_model == "hamood.usd":
            voice_id = "Iz1ejgotCK1hkJYNJ7eZ"
            print(f"🔥 hamood model detected! Using voice_id: {voice_id}")
            

        input_text = text # Start with the raw text

        if requested_emotion and requested_emotion != "conversational":
            input_text = f"[{requested_emotion}] {text}"
        

        # Generate audio using the combined input_text
        audio_generator = client.text_to_speech.convert(
            text=input_text, # Use the modified input string here
            voice_id=voice_id,
            model_id="eleven_v3",
            output_format="mp3_44100_128"
        )

        # Save to file
        file_path = os.path.join(AUDIO_DIR, filename)
        with open(file_path, "wb") as f:
            for chunk in audio_generator:
                f.write(chunk)

                
  

        # Load the MP3 file
        mp3_audio = AudioSegment.from_mp3(file_path)

        # Slow down the audio (e.g. 0.9 = 90% speed, slightly slower)
        slowed_audio = change_audio_speed(mp3_audio, speed=0.9)

        # Export it to a WAV file
        # mp3_audio.export(file_path, format="wav")
        
        # Export it to a WAV file
        slowed_audio.export(file_path, format="wav")

        print("Conversion complete")

        return jsonify({"success": True, "audioPath": f"/audio/{filename}"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
