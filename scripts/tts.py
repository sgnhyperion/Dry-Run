from flask import Flask, request, jsonify
import pyttsx3
import os
from waitress import serve

app = Flask(__name__)

# Ensure the audio directory exists
AUDIO_DIR = "D:/chat-avatar-app/public/audio"
if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)

@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    data = request.json
    text = data.get('text')
    filename = data.get('filename')
    gender = data.get('gender', 'male').lower()  # Default to male

    if not text or not filename:
        return jsonify({"success": False, "error": "Text and filename are required"}), 400

    try:
        # Initialize the TTS engine
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)  # Adjust speed
        engine.setProperty('volume', 0.9)  # Set volume

        # Select male or female voice
        voices = engine.getProperty('voices')
        selected_voice = None

        # Try to find a voice that matches the gender
        for voice in voices:
            voice_name = voice.name.lower()
            if gender == "female" and ("female" in voice_name or "zira" in voice_name or "samantha" in voice_name):
                selected_voice = voice.id
                break
            elif gender == "male" and ("male" in voice_name or "david" in voice_name or "alex" in voice_name):
                selected_voice = voice.id
                break

        # If no exact match found, use the first available female/male voice as fallback
        if selected_voice is None:
            for voice in voices:
                if gender == "female" and "female" in voice.name.lower():
                    selected_voice = voice.id
                    break
                elif gender == "male" and "male" in voice.name.lower():
                    selected_voice = voice.id
                    break

        # Apply selected voice if found
        if selected_voice:
            engine.setProperty('voice', selected_voice)
        else:
            print("Warning: No suitable voice found, using default voice.")

        # Construct the full file path
        file_path = os.path.join(AUDIO_DIR, filename)

        # Save the audio file
        engine.save_to_file(text, file_path)
        engine.runAndWait()

        # Verify the file was created
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "Failed to save audio file"}), 500

        return jsonify({"success": True, "audioPath": f"/audio/{filename}"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # app.run(debug=True, port=5001)  # Run on port 5001
    print("Starting Flask with Waitress on port 5001")
    serve(app, host="0.0.0.0", port=5001)
