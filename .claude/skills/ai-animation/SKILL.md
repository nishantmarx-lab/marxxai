---
name: ai-animation
description: Produce a finished 3D-animated short (Reels/TikTok/Shorts, 15-60s) end to end with Marxx tools - interview, script, consistent characters, voices, animation, review, final cut, cover and caption. Use when the user says "make an animated short", "AI animation", "/ai-animation", or wants a Pixar-style story reel. Claude does the production work; the user makes the creative calls.
---

# AI Animation (Marxx pipeline)

Principle: **Claude does the work, the user makes the calls.** Stop at every ★ checkpoint and get approval before spending credits on the next stage.

Before starting: if no Marxx client is selected, run `marxx_select_workspace` and ask which client. Run `marxx_credit_balance` and keep a running credit tally; use `marxx_estimate_cost` before every batch generation and show the number.

## 1. Interview (one question at a time)
Collect: story idea / message, tone (funny, emotional, ad, educational), platform + aspect ratio (default 9:16), target length (default 30s), characters (default: one male lead + one female lead), setting (default: cozy living room), language, whether it is for a brand (if so pull `marxx_brand_knowledge` / `marxx_brand_assets` / `marxx_products`), and budget mode:
- **Lean** (default): native-audio video, no separate lip sync.
- **Premium**: allows `marxx_lip_sync` on hero dialogue shots only.

## 2. Script ★
Write a shot list table: `# | duration | shot type (wide/medium/close/reaction/cutaway) | action | dialogue (speaker) | on-screen text`.
Rules: hook in the first 2s, 4-8 shots, each shot 3-6s, max ~2 lines of dialogue per shot, a clear payoff/punchline in the last shot. Mark each dialogue shot as `face-on` (mouth visible) or `off-face` (back, wide, cutaway, reaction from listener).
Get approval.

## 3. Characters & set (the consistency trick) ★
Run `marxx_list_models` once to pick the best available image and video models.
- Generate one **character sheet per character** with `marxx_generate_image`: "3D Pixar-style animated character, [description], full body front view + 3/4 view + face close-up, neutral background, consistent outfit, soft studio lighting". Show options; let the user pick or restyle via `marxx_edit_image`.
- Generate the **set** (empty environment, same style and lighting).
- Upload/keep the chosen images as references (`marxx_upload_asset` / `marxx_save_to_board`). Store them in a style bible: fixed character descriptions, palette, lighting, lens, render style. **Reuse the exact same reference images and description text in every later prompt.** Never re-describe a character differently.

## 4. Voices & length check ★
- `marxx_list_voices` -> propose a voice per character; user picks.
- Generate each line with `marxx_generate_voiceover` (keep per-line files). Narration optional.
- Sum the audio durations + silent shots. If over target length, trim lines, don't speed up audio. Report final timing per shot.

## 5. Animate
For each shot (batch, after showing cost):
1. Keyframe: `marxx_edit_image` / `marxx_generate_image` composing the character refs into the set, in the shot's framing.
2. Motion: `marxx_animate_image` (or `marxx_generate_video` with the keyframe as image input), duration = that shot's timing.
   - Dialogue shot, `face-on`, Lean mode: prefer a model with native speech/audio and put the exact line in the prompt; otherwise prompt "character speaking naturally, mouth moving" and lay the voiceover over it.
   - Dialogue shot, `off-face`: animate with no talking; voiceover carries it.
   - Premium mode, hero face-on lines only: `marxx_lip_sync` with the voiceover file.
3. Poll `marxx_generation_status` until done. If a shot breaks character consistency, regenerate from the keyframe; don't change the description.

## 6. Review Room ★
Present the shots in order with timecodes. The user leaves notes like `00:07 - her hair changes colour`. Keep a notes list (number, timecode, note, status). For each note: say what you'll change, regenerate **only that shot**, mark it fixed. User can edit/delete notes. Loop until approved. Use `marxx_qa_review` for a final automated check (consistency, artefacts, text).

## 7. Final cut
- Music: `marxx_generate_music` (mood + exact total length, no vocals under dialogue) or a user-supplied track.
- `marxx_stitch_videos` in shot order -> `marxx_add_audio_to_video` for voices + music (music ducked under speech).
- Burned-in captions for dialogue (most viewers watch muted) via the editor (`marxx_open_in_editor` / `marxx_editor_edit`), or ffmpeg locally if available.
- If needed, `marxx_upscale_video`. Deliver the final file link.

## 8. Cover & caption
- Cover: `marxx_extract_frame` of the best moment, or a fresh `marxx_generate_image` with big hook text; `marxx_resize_image` for 9:16 and 1:1.
- Caption: hook line, 1-2 sentence story tease, CTA, 3-5 hashtags. Give 3 variants.

## Wrap-up
Summarise: final video, cover, caption, credits spent, and the style bible (so a sequel episode reuses the same characters).
