"""Build the site's original music-box loops. Requires Python 3 and ffmpeg."""
import math
from pathlib import Path
import struct
import subprocess
import tempfile
import wave

OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "audio"
RATE = 22050
# MIDI notes and lengths in beats. Each melody resolves to its opening key.
MELODIES = {
    "little-cloud": (62, [(72, 1), (76, 1), (79, 2), (76, 1), (74, 1),
                          (72, 2), (74, 1), (77, 1), (81, 2), (79, 1),
                          (76, 1), (72, 2)]),
    "twilight-cradle": (58, [(69, 1), (72, 1), (76, 1), (74, 2), (72, 1),
                             (69, 2), (67, 1), (65, 1), (69, 1), (72, 1),
                             (71, 2), (69, 4)]),
    "starry-dreams": (60, [(79, 1), (83, 1), (86, 2), (83, 2), (81, 1),
                           (79, 1), (76, 2), (74, 2), (76, 1), (79, 1),
                           (81, 2), (79, 4)]),
    "softly-home": (56, [(74, 2), (78, 1), (81, 1), (78, 2), (76, 2),
                         (74, 1), (71, 1), (69, 2), (71, 1), (73, 1),
                         (74, 2)]),
}


def encode(source, name):
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", str(RATE), "-ac", "1",
        "-codec:a", "libmp3lame", "-b:a", "96k", str(OUTPUT / f"{name}.mp3")
    ], check=True)


with tempfile.TemporaryDirectory() as directory:
    for name, (bpm, phrase) in MELODIES.items():
        beat = 60 / bpm
        notes = phrase * 2
        duration = sum(length for _, length in notes) * beat
        samples = [0.0] * round(duration * RATE)
        onset = 0.0
        for midi, beats in notes:
            frequency = 440 * 2 ** ((midi - 69) / 12)
            length = beats * beat
            for offset in range(round(length * RATE)):
                index = round(onset * RATE) + offset
                if index >= len(samples):
                    break
                time = offset / RATE
                envelope = min(1, time / .035) * math.exp(-3.5 * time / length)
                envelope *= min(1, (length - time) / .12)
                tone = (math.sin(2 * math.pi * frequency * time)
                        + .15 * math.sin(4 * math.pi * frequency * time)
                        + .04 * math.sin(6 * math.pi * frequency * time))
                samples[index] = .55 * envelope * tone
            onset += length
        source = Path(directory) / f"{name}.wav"
        with wave.open(str(source), "wb") as output:
            output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
            output.writeframes(b"".join(
                struct.pack("<h", round(sample * 32767
                    * min(1, index / (RATE * .15), (len(samples) - index) / (RATE * .4))))
                for index, sample in enumerate(samples)
            ))
        encode(source, name)
    encode(OUTPUT / "moonlight-hush.wav", "moonlight-hush")
