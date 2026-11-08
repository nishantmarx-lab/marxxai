"""Assemble an animation project: python3 build_cut.py <project_dir>
Reads project.json; needs shots/sNN.mp4, audio per shot, music/score.mp3, optional music/sfx_*.mp3."""
import json, os, subprocess, sys
d = sys.argv[1]; os.chdir(d)
p = json.load(open("project.json"))
W, H, FPS = 1080, 1920, 30
wm = p.get("watermark_box")  # [x,y,w,h] in source pixels
os.makedirs("final/tmp", exist_ok=True)
def run(c): subprocess.run(c, check=True)
# 1. normalise + trim each shot
t = 0; starts = []; parts = []
for s in p["shots"]:
    n, dur = s["n"], s["dur"]; starts.append(t)
    src = f"shots/s{n:02d}.mp4"
    srcdur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",src]))
    vf = []
    if wm: vf.append(f"delogo=x={wm[0]}:y={wm[1]}:w={wm[2]}:h={wm[3]}")
    vf += [f"scale={W}:{H}:flags=lanczos", f"fps={FPS}"]
    if dur > srcdur: vf.append(f"tpad=stop_mode=clone:stop_duration={dur-srcdur+0.1}")
    if s.get("fade_out"): vf.append(f"fade=t=out:st={dur-s['fade_out']}:d={s['fade_out']}")
    out = f"final/tmp/v{n:02d}.mp4"
    run(["ffmpeg","-loglevel","error","-y","-i",src,"-t",str(dur),"-vf",",".join(vf),"-an","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",out])
    parts.append(out); t += dur
total = t
open("final/tmp/list.txt","w").write("".join(f"file '{os.path.basename(x)}'\n" for x in parts))
run(["ffmpeg","-loglevel","error","-y","-f","concat","-safe","0","-i","final/tmp/list.txt","-c","copy","final/tmp/video.mp4"])
# 2. captions (ASS)
def ts(x): return f"{int(x//3600)}:{int(x%3600//60):02d}:{x%60:05.2f}"
ass = ["[Script Info]","ScriptType: v4.00+",f"PlayResX: {W}",f"PlayResY: {H}","","[V4+ Styles]",
 "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
 "Style: Cap,DejaVu Sans,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,5,2,2,80,80,460,1",
 "Style: Title,DejaVu Serif,58,&H00E8E8E8,&H00FFFFFF,&H00000000,&H00000000,0,1,0,0,100,100,2,0,1,3,0,8,80,80,260,1",
 "","[Events]","Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
audio = []
for s, st in zip(p["shots"], starts):
    if s.get("text"):
        ass.append(f"Dialogue: 0,{ts(st+0.2)},{ts(st+s['dur']-0.2)},Title,,0,0,0,,{{\\fad(300,300)}}{s['text']}")
    if s.get("audio"):
        a0 = st + 0.3; ad = s["audio_dur"]
        line = s["lines"][0]["text"].replace("'", "’")
        ass.append(f"Dialogue: 0,{ts(a0)},{ts(min(a0+ad+0.4, st+s['dur']))},Cap,,0,0,0,,{line}")
        audio.append((s["audio"], a0))
open("final/tmp/captions.ass","w").write("\n".join(ass)+"\n")
# 3. audio mix: voices + ducked score + sfx
inp = []; f = []; vl = []
for i,(a,a0) in enumerate(audio):
    inp += ["-i",a]; ms=int(a0*1000); f.append(f"[{i}]adelay={ms}|{ms},volume=1.6[v{i}]"); vl.append(f"[v{i}]")
k = len(audio)
f.append(f"{''.join(vl)}amix=inputs={k}:normalize=0,apad=whole_dur={total},asplit=2[vox][sc]")
inp += ["-i","music/score.mp3"]; f.append(f"[{k}]volume=0.35,atrim=0:{total}[mus]"); k+=1
f.append("[mus][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck]")
mix = ["[vox]","[duck]"]
for sfx in p.get("sfx", []):
    inp += ["-i",sfx["file"]]; ms=int(sfx["at"]*1000)
    f.append(f"[{k}]volume={sfx.get('vol',1)},adelay={ms}|{ms}[x{k}]"); mix.append(f"[x{k}]"); k+=1
f.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,atrim=0:{total},loudnorm=I=-14:TP=-1.5:LRA=11[out]")
run(["ffmpeg","-loglevel","error","-y",*inp,"-filter_complex",";".join(f),"-map","[out]","-ar","48000","final/tmp/mix.wav"])
# 4. final
slug = p.get("slug","video")
run(["ffmpeg","-loglevel","error","-y","-i","final/tmp/video.mp4","-i","final/tmp/mix.wav","-vf","ass=final/tmp/captions.ass",
     "-c:v","libx264","-preset","slow","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",f"final/{slug}_9x16.mp4"])
print("done", f"final/{slug}_9x16.mp4", total)
