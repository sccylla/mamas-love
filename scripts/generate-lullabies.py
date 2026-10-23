"""Render original soft-piano arrangements. Requires Python 3 and ffmpeg."""
import math
from pathlib import Path
import struct
import subprocess
import tempfile
import wave

OUTPUT = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
RATE = 22050
# Public-domain melodies, plus Mama's Love's original Softly Home.
TRACKS = {
    'brahms-lullaby': (60, 3, [
        (64, .5), (64, .5), (67, 2), (64, .5), (64, .5), (67, 2),
        (64, .5), (67, .5), (72, 1), (71, 1), (69, 2), (69, 1), (67, 3),
        (62, .5), (64, .5), (65, 2), (62, .5), (64, .5), (65, 2),
        (62, .5), (65, .5), (71, 1), (69, 1), (67, 2), (71, 1), (72, 3)
    ], [(48, 52, 55), (48, 52, 55), (53, 57, 60), (48, 52, 55),
        (55, 59, 62), (55, 59, 62), (55, 59, 62), (48, 52, 55)]),
    'twinkle-lullaby': (64, 4, [
        (60, 1), (60, 1), (67, 1), (67, 1), (69, 1), (69, 1), (67, 2),
        (65, 1), (65, 1), (64, 1), (64, 1), (62, 1), (62, 1), (60, 2),
        (67, 1), (67, 1), (65, 1), (65, 1), (64, 1), (64, 1), (62, 2),
        (67, 1), (67, 1), (65, 1), (65, 1), (64, 1), (64, 1), (62, 2),
        (60, 1), (60, 1), (67, 1), (67, 1), (69, 1), (69, 1), (67, 2),
        (65, 1), (65, 1), (64, 1), (64, 1), (62, 1), (62, 1), (60, 2)
    ], [(48, 52, 55), (53, 57, 60), (48, 52, 55), (55, 59, 62),
        (48, 52, 55), (55, 59, 62), (48, 52, 55), (55, 59, 62),
        (48, 52, 55), (53, 57, 60), (48, 52, 55), (48, 52, 55)]),
    'softly-home-piano': (56, 4, [
        (74, 2), (78, 1), (81, 1), (78, 2), (76, 2),
        (74, 1), (71, 1), (69, 2), (71, 1), (73, 1), (74, 2)
    ] * 2, [(50, 54, 57), (55, 59, 62), (50, 54, 57), (57, 61, 64)])
}


def note(samples, midi, onset, length, gain):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    for offset in range(round((length + .4) * RATE)):
        index = round(onset * RATE) + offset
        if index >= len(samples):
            break
        time = offset / RATE
        envelope = min(1, time / .045) * math.exp(-2.3 * time / max(length, .6))
        envelope *= min(1, (length + .4 - time) / .35)
        phase = 2 * math.pi * frequency * time
        tone = (math.sin(phase) + .23 * math.exp(-time * 2) * math.sin(phase * 2)
                + .07 * math.exp(-time * 3) * math.sin(phase * 3))
        samples[index] += gain * envelope * tone


with tempfile.TemporaryDirectory() as directory:
    for name, (bpm, bar, melody, chords) in TRACKS.items():
        beat = 60 / bpm
        duration = sum(length for _, length in melody) * beat + 1
        samples = [0.0] * round(duration * RATE)
        onset = 0
        for index, (midi, beats) in enumerate(melody):
            note(samples, midi, onset * beat, beats * beat, .36 * (1 + .06 * math.sin(index)))
            onset += beats
        for index in range(math.ceil(onset / bar)):
            chord = chords[index % len(chords)]
            for step, midi in enumerate(chord):
                note(samples, midi, (index * bar + step * .5) * beat, 2 * beat, .075)
        source = Path(directory) / 'piano.wav'
        peak = max(abs(sample) for sample in samples)
        with wave.open(str(source), 'wb') as output:
            output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
            output.writeframes(b''.join(struct.pack('<h', round(sample / peak * .85 * 32767
                * min(1, index / (RATE * .15), (len(samples) - index) / (RATE * .7))))
                for index, sample in enumerate(samples)))
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
            '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ar', str(RATE), '-ac', '1',
            '-codec:a', 'libmp3lame', '-b:a', '96k', str(OUTPUT / f'{name}.mp3')
        ], check=True)
