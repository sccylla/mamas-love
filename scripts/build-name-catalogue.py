"""Export the hand-selected catalogue. Run the pronunciation generator afterwards."""
from pathlib import Path
from collections import Counter
import json
import unicodedata
root = Path(__file__).resolve().parents[1]
entries, seen, category = [], set(), None
for number, raw in enumerate((root / 'data/curated-names.txt').read_text().splitlines(), 1):
    line = raw.strip()
    if not line or line.startswith('#'):
        continue
    if line.startswith('[') and line.endswith(']'):
        category = line[1:-1]
        continue
    name, gender, meaning = [part.strip() for part in line.split('|')]
    key = (category, unicodedata.normalize('NFC', name).casefold())
    if category not in {'Yoruba','Oriki','English','Hebrew','Islamic'} or gender not in {'girl','boy','unisex'} or not meaning or key in seen:
        raise ValueError(f'Invalid or duplicate entry on line {number}: {line}')
    seen.add(key)
    entries.append({'n':name,'g':gender,'c':category,'m':meaning})
counts = dict(Counter(entry['c'] for entry in entries))
(root / 'assets/names-data.js').write_text('/* Hand-selected names; source: data/curated-names.txt. */\nwindow.MAMAS_NAMES=' + json.dumps(entries, ensure_ascii=False, separators=(',',':')) + ';\nwindow.MAMAS_NAME_COUNTS=' + json.dumps(counts, separators=(',',':')) + ';\n')
print(json.dumps({'total':len(entries), 'categories':counts}))
