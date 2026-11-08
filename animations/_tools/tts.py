import sys, certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts, asyncio
voice, rate, text, out = sys.argv[1:5]
asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(out))
