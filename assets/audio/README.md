# Background lullabies

`moonlight-hush.wav` is a local, original music-box-style arrangement of the Moonlight Hush pattern already used in the site’s sound library (seed 11). It contains 32 notes at 55 beats per minute, uses soft sine harmonics, and fades at both ends for a gentle loop. Mono 22,050Hz, 16-bit PCM WAV, approximately 35 seconds. No external recording or third-party playback service is used.

The active playlist contains three soft-piano instrumental arrangements with gentle broken-chord accompaniment:

- `brahms-lullaby.mp3`: an arrangement of the public-domain melody from Brahms’ *Wiegenlied*, Op. 49 No. 4 (1868).
- `twinkle-lullaby.mp3`: an arrangement of the traditional public-domain melody *Ah! vous dirai-je, maman*, familiar as Twinkle, Twinkle, Little Star.
- `softly-home-piano.mp3`: an original Mama’s Love melody.

These are locally synthesized arrangements, with no external recording or playback service. Tracks are normalized to -18 LUFS with a -2 dB true-peak target and encoded as mono 22,050Hz, 96kbps MP3. Only the selected file is loaded. Rebuild this playlist with `python3 scripts/generate-lullabies.py` (requires ffmpeg). Older music-box assets are retained for existing links but are excluded from autoplay.
