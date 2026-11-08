---
name: ai-animation
description: Marxx.agency AI Animation - produce a finished 3D-animated short (Reels/TikTok/Shorts, 15-60s) end to end inside Claude Code - interview, script, consistent characters, voices, animation, review, final cut, cover and caption. Use when the user says "make an animated short", "AI animation", "/ai-animation", or wants a Pixar-style story reel. Claude does the production work; the user makes the creative calls.
---

# AI Animation by Marxx.agency

Principle: **Claude does the work, the user makes the calls.** Stop at every ★ checkpoint and get approval before spending money on the next stage.

All work lives in a project folder: `animations/<slug>/` with subfolders `refs/ audio/ keyframes/ shots/ music/ final/` plus `project.json` (script, style bible, shot status, notes, spend log). Read and update `project.json` at every step so a session can resume.

## 0. Setup
Check, and fix with the user where needed:
- `ffmpeg` and `ffprobe` installed (required - all assembly is local).
- Python 3 with `requests` (for API calls).
- Provider keys as environment variables - never ask the user to paste keys into chat. Supported providers (user picks per stage):

| Stage | Free path | Paid path |
|---|---|---|
| Images (characters, set, keyframes) | Google AI Studio free tier (Gemini image), or local ComfyUI/SDXL | fal.ai (Flux Kontext / Nano Banana), OpenAI images |
| Video (image-to-video) | Free daily credits on Kling / Hailuo / Pika web apps (user uploads keyframe, drops clip into `shots/`), or local Wan 2.x via ComfyUI | fal.ai or Replicate (Kling, Veo 3, Hailuo, Wan) |
| Voice | Edge TTS (`pip install edge-tts`) or Piper (local) | ElevenLabs |
| Music | Royalty-free libraries (YouTube Audio Library, Pixabay Music) | Artlist, Epidemic Sound, ElevenLabs Music, Suno |
| Lip sync (Premium only) | LatentSync / Wav2Lip (local GPU) | fal.ai / Sync Labs |

Write small reusable scripts into `animations/_tools/` (e.g. `gen_image.py`, `gen_video.py`, `tts.py`) the first time a provider is used; reuse them afterwards. Log each paid call and its cost to `project.json`, show an estimate before every batch, and report total spend at the end.

When the user uses a manual web app (free path), give them the exact prompt + which keyframe to upload, then wait for them to drop the file into the right folder with the right name.

## 1. Interview (one question at a time)
Collect: story idea / message, tone (funny, emotional, ad, educational), platform + aspect ratio (default 9:16), target length (default 30s), characters (default: one male lead + one female lead), setting (default: cozy living room), language, whether it is for a brand (if so: brand name, product, logo/colours, CTA), tool path (free / paid / mix per stage), and budget mode:
- **Lean** (default): native-audio video models or voice-over, no separate lip sync.
- **Premium**: lip sync allowed on hero dialogue shots only.

## 2. Script ★
Write a shot list table: `# | duration | shot type (wide/medium/close/reaction/cutaway) | action | dialogue (speaker) | on-screen text`.
Rules: hook in the first 2s, 4-8 shots, each shot 3-6s, max ~2 lines of dialogue per shot, a clear payoff/punchline in the last shot. Mark each dialogue shot `face-on` (mouth visible) or `off-face` (back, wide, cutaway, listener's reaction). In Lean mode, push most dialogue to `off-face` shots.
Get approval. Save to `project.json`.

## 3. Characters & set - the consistency trick ★
- Generate a **character sheet per character**: "3D Pixar-style animated character, [description], full body front view + 3/4 view + face close-up, neutral background, consistent outfit, soft studio lighting". 2-3 options each; user picks or asks for edits.
- Generate the **set** (empty environment, same style and lighting).
- Save picks to `refs/`. Write a **style bible** into `project.json`: fixed character description text, palette, lighting, lens, render style.
- **Every later prompt reuses the exact same reference images and description text.** Never re-describe a character differently. Use reference-image / edit models (Kontext, Nano Banana, Gemini image) so the refs are inputs, not just words.

## 4. Voices & length check ★
- Propose a voice per character from the chosen TTS provider (play/describe samples); user picks.
- Generate one file per line into `audio/` (`s03_l1_maya.mp3`).
- Measure with `ffprobe`. Sum audio + silent shots. If over target length, trim lines - don't speed up audio. Set each shot's duration to fit its lines + ~0.5s. Report timing per shot.

## 5. Animate
For each shot (show cost first, then batch):
1. **Keyframe** -> `keyframes/sNN.png`: reference-image model composing the character refs into the set, in the shot's framing and aspect ratio.
2. **Motion** -> `shots/sNN.mp4`: image-to-video from the keyframe, duration = shot timing.
   - `face-on` dialogue, Lean: a native-audio model (e.g. Veo 3) with the exact line in the prompt; otherwise prompt "character speaking naturally, mouth moving" and lay the voice-over on top.
   - `off-face` dialogue: animate with no talking; voice-over carries it.
   - Premium, hero face-on lines only: run lip sync with the line's audio file.
3. If a shot breaks character consistency, regenerate from the keyframe - don't change the description.

## 6. Review Room ★
Build a quick preview (`ffmpeg` concat of current shots + voices) into `final/preview.mp4` and list shots with timecodes. The user leaves notes like `00:07 - her hair changes colour`. Keep notes in `project.json` (number, timecode, shot, note, status). For each note: say what you'll change, regenerate **only that shot**, mark it fixed, rebuild the preview. User can edit/delete notes. Loop until approved. Before exiting, self-check frames (`ffmpeg -ss T -frames:v 1`) for consistency, artefacts and text errors.

## 7. Final cut (ffmpeg)
- Normalise all shots to the same resolution, fps (30) and codec, then concat.
- Place each voice line at its shot's start offset; mix music at ~-18 dB with sidechain ducking under speech; loudness-normalise to about -14 LUFS.
- Burn in captions for dialogue (generate an `.ass`/`.srt` from the script + timings; bold, centred, safe zone above the bottom 20%).
- Add brand end card / logo if it is a brand video.
- Output `final/<slug>_9x16.mp4` (H.264, yuv420p, AAC).

## 8. Cover & caption
- Cover: extract the best frame or generate one with big hook text; export 9:16 (1080x1920) and 1:1 (1080x1080) into `final/`.
- Caption: hook line, 1-2 sentence story tease, CTA, 3-5 hashtags. Give 3 variants.

## Wrap-up
Summarise: final video path, covers, captions, total spend by provider, and the style bible - so a sequel episode reuses the same characters and set.

---
Made by Marxx.agency.
