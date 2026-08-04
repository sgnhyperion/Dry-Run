import argparse
import os
import requests
import time

# ✅ Audio2Face API (LOCAL)
A2F_API_URL = "http://127.0.0.1:8011/A2F"

# ✅ WINDOWS MODEL PATH FIX
MODELS_BASE_DIR = r"D:/chat-avatar-app"

# ✅ Emotion Blending Map
EMOTION_BLEND_MAP = {
    "flirty": {"joy": 60, "cheekiness": 40},
    "happy": {"joy": 70, "calmness": 30},
    "romantic": {"calmness": 40, "joy": 40, "cheekiness": 20},
    "confident": {"calmness": 50, "amazement": 30, "joy": 20},
    "excited": {"amazement": 60, "joy": 40},
    "tired": {"sadness": 50, "calmness": 50},
    "nervous": {"fear": 60, "sadness": 40},
    "angry": {"anger": 100},
    "default": {"joy": 100},
    "conversational": {"calmness": 80, "joy": 20}
}

def post_request(endpoint, payload):
    url = f"{A2F_API_URL}/{endpoint}"
    res = requests.post(url, json=payload)
    if res.status_code != 200:
        raise Exception(f"A2F ERROR {endpoint}: {res.text}")
    return res.json()

def process_audio_to_usd(audio_path, usd_model_name, output_dir, message_id, emotion):
    usd_file_path = os.path.join(MODELS_BASE_DIR, usd_model_name)
    raw_audio_file_name = os.path.basename(audio_path)
    directory_audio = os.path.dirname(audio_path)

    print("AUDIO:", raw_audio_file_name)
    print("MODEL:", usd_file_path)

    # 1️⃣ Load USD
    post_request("USD/Load", {"file_name": usd_file_path})

    # 2️⃣ Set Root Path
    post_request("Player/SetRootPath", {
        "a2f_player": "/World/LazyGraph/Player",
        "dir_path": directory_audio,
    })

    # 3️⃣ Set Audio Track
    post_request("Player/SetTrack", {
        "a2f_player": "/World/LazyGraph/Player",
        "file_name": raw_audio_file_name,
    })

    time.sleep(0.5)

    # 4️⃣ Emotion Resolve
    final_emotions = EMOTION_BLEND_MAP.get(emotion.lower(), {emotion.lower(): 100})

    post_request("A2E/SetEmotionByName", {
        "a2f_instance": "/World/LazyGraph/CoreFullface",
        "emotions": final_emotions,
    })

    # 5️⃣ Export Cache
    post_request("Exporter/ExportGeometryCache", {
        "export_directory": output_dir,
        "file_name": f"cache_{message_id}",
        "cache_type": "usd",
        "xform_keys": "false",
        "batch": "false",
        "fps": 30,
    })

    final_usd_path = os.path.join(output_dir, f"cache_{message_id}_cache.usd")
    return final_usd_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("audio_path")
    parser.add_argument("usd_model_name")
    parser.add_argument("output_dir")
    parser.add_argument("message_id")
    parser.add_argument("emotion")

    args = parser.parse_args()

    process_audio_to_usd(
        args.audio_path,
        args.usd_model_name,
        args.output_dir,
        args.message_id,
        args.emotion,
    )
