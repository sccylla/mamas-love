# Background lullabies

`moonlight-hush.wav` is a local, original music-box-style arrangement of the Moonlight Hush pattern already used in the site’s sound library (seed 11). It contains 32 notes at 55 beats per minute, uses soft sine harmonics, and fades at both ends for a gentle loop. Mono 22,050Hz, 16-bit PCM WAV, approximately 35 seconds. No external recording or third-party playback service is used.

The site rotates between five local MP3s: Moonlight Hush, Little Cloud, Twilight Cradle, Starry Dreams and Softly Home. The latter four use distinct original melodies, with soft harmonics and slow tempos. They are normalized to -18 LUFS with a -2 dB true-peak target, then encoded as mono 22,050Hz, 96kbps MP3. Only the selected file is loaded. Rebuild with `python3 scripts/generate-lullabies.py` (requires ffmpeg).
