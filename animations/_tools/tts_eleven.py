"""ElevenLabs TTS: python3 tts_eleven.py VOICE_ID "text" out.mp3 [stability]
Key is injected by the session proxy (header xi-api-key); locally set ELEVENLABS_API_KEY."""
import os, sys, requests
vid, text, out = sys.argv[1:4]
stab = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4
r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}",
    headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")},
    json={"text": text, "model_id": "eleven_multilingual_v2",
          "voice_settings": {"stability": stab, "similarity_boost": 0.8, "style": 0.35}},
    timeout=120)
if r.status_code != 200: sys.exit(f"{r.status_code} {r.text[:300]}")
open(out, "wb").write(r.content)
print(out, len(r.content))
