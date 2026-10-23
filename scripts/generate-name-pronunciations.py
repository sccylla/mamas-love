"""Build static approximate name guides; nothing runs on a service at page load.

Build dependencies: cmudict==1.1.3, g2p-en==2.1.0 and NumPy (pip).
The standalone predictor is loaded without NLTK's unused tagger/tokenizer downloads.
"""
import ast
from collections import Counter
import importlib.util
import json
import os
from pathlib import Path
import re
import unicodedata
import cmudict
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'assets/names-data.js').read_text()
names = json.loads(source.split('window.MAMAS_NAMES=', 1)[1].split(';\n', 1)[0])
overrides = json.loads((ROOT / 'data/name-pronunciation-overrides.json').read_text())
lexicon = cmudict.dict()
# Only the installed predictor class is needed. Its POS-aware text interface is
# deliberately not imported: names are already individual words and need no tagger.
module_path = Path(importlib.util.find_spec('g2p_en').origin).with_name('g2p.py')
model_class = next(node for node in ast.parse(module_path.read_text()).body if isinstance(node, ast.ClassDef) and node.name == 'G2p')
namespace = {'np': np, 'os': os, 'dirname': str(module_path.parent), 'cmudict': cmudict,
             'construct_homograph_dictionary': lambda: {}}
exec(compile(ast.Module(body=[model_class], type_ignores=[]), str(module_path), 'exec'), namespace)
model = namespace['G2p']()

VOWELS = {'AA':'ah', 'AE':'a', 'AH':'uh', 'AO':'aw', 'AW':'ow', 'AY':'eye',
          'EH':'eh', 'ER':'er', 'EY':'ay', 'IH':'ih', 'IY':'ee', 'OW':'oh',
          'OY':'oy', 'UH':'oo', 'UW':'oo'}
CONSONANTS = {'B':'b','CH':'ch','D':'d','DH':'th','F':'f','G':'g','HH':'h',
              'JH':'j','K':'k','L':'l','M':'m','N':'n','NG':'ng','P':'p','R':'r',
              'S':'s','SH':'sh','T':'t','TH':'th','V':'v','W':'w','Y':'y','Z':'z','ZH':'zh'}
CLUSTERS = {'pl','pr','bl','br','tr','dr','kl','kr','gl','gr','fl','fr','thr',
            'sk','sl','sm','sn','sp','st','sw','str','spr','spl','skr','skw','shr','tw','dw','kw'}

def clean(word):
    word = word.lower().translate(str.maketrans({'æ':'ae', 'œ':'oe', 'þ':'th', 'ð':'th', 'ł':'l', 'ø':'o'}))
    return ''.join(char for char in unicodedata.normalize('NFD', word) if not unicodedata.combining(char))

def respell(phones):
    nuclei = [i for i, phone in enumerate(phones) if phone.rstrip('012') in VOWELS]
    if not nuclei:
        return ''.join(CONSONANTS.get(phone, '') for phone in phones)
    starts = [0]
    for previous, current in zip(nuclei, nuclei[1:]):
        between = phones[previous + 1:current]
        if not between:
            starts.append(current)
        elif len(between) == 1 and phones[previous].endswith('1') and phones[previous].rstrip('012') in {'AE','EH','IH','AH','AA'}:
            starts.append(current)
        else:
            count = 1
            for size in range(2, len(between) + 1):
                if ''.join(CONSONANTS.get(phone, '') for phone in between[-size:]) in CLUSTERS:
                    count = size
            starts.append(current - count)
    result = []
    for index, start in enumerate(starts):
        syllable = phones[start:starts[index + 1] if index + 1 < len(starts) else len(phones)]
        value = ''.join(VOWELS.get(phone.rstrip('012'), CONSONANTS.get(phone, '')) for phone in syllable)
        if any(phone.endswith('1') for phone in syllable):
            value = value.upper()
        if value:
            result.append(value)
    return '-'.join(result)


def syllable_guide(word, yoruba=False):
    word = unicodedata.normalize('NFD', word.lower()).replace('s\u0323', 'sh').replace('o\u0323', 'ọ').replace('e\u0323', 'ẹ')
    word = ''.join(char for char in word if not unicodedata.combining(char))
    vowels = {'a':'ah', 'e':'eh', 'ẹ':'eh', 'i':'ee', 'o':'oh', 'ọ':'aw', 'u':'oo'}
    result, pending, index = [], '', 0
    while index < len(word):
        char = word[index]
        if char in vowels:
            sound = vowels[char]
            # Long vowels and common transliterations in Arabic names.
            if not yoruba and index + 1 < len(word) and word[index:index + 2] in {'aa','ee','ii','oo','uu','ou','ay','ai','aw'}:
                sound = {'aa':'ah','ee':'ee','ii':'ee','oo':'oo','uu':'oo','ou':'oo','ay':'eye','ai':'eye','aw':'ow'}[word[index:index + 2]]
                index += 1
            index += 1
            if index < len(word) and word[index] in 'nm' and (index + 1 == len(word) or word[index + 1] not in vowels):
                sound += word[index]
                index += 1
            result.append(pending + sound)
            pending = ''
        elif char.isalpha():
            pending += char
            index += 1
        else:
            if pending:
                result.append(pending)
                pending = ''
            index += 1
    if pending:
        if result:
            result[-1] += pending
        else:
            result.append(pending)
    return '-'.join(result)

output, counts, cache = {}, Counter(), {}
for name in names:
    key = name['c'] + '|' + name['n']
    if key in overrides:
        guide, method = overrides[key], 'existing guide'
    elif name['c'] in {'Yoruba', 'Oriki'}:
        guide, method = syllable_guide(name['n'], True), 'Yoruba syllable guide'
    else:
        words = re.findall('[a-z]+', clean(name['n']))
        parts, methods = [], []
        for word in words:
            if word in lexicon:
                parts.append(respell(lexicon[word][0])); methods.append('dictionary')
            elif name['c'] == 'Islamic':
                parts.append(syllable_guide(word)); methods.append('transliteration')
            else:
                if word not in cache:
                    cache[word] = respell(model.predict(word))
                parts.append(cache[word]); methods.append('spelling predictor')
        guide, method = ' '.join(parts), max(methods, key=lambda item: item != 'dictionary') if methods else 'syllable guide'
    if not guide or len(guide) > 100:
        guide, method = syllable_guide(name['n'], name['c'] in {'Yoruba','Oriki'}), 'syllable guide'
    if not guide:
        raise ValueError('Missing guide for ' + key)
    output[key] = guide
    counts[method] += 1
(ROOT / 'assets/name-pronunciation-data.js').write_text(
    '/* Approximate reading guides; see name-pronunciation-LICENSE.txt and README.md. */\nwindow.MAMAS_PRONUNCIATION_DATA=' + json.dumps(output, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(json.dumps({'entries': len(output), 'methods': dict(counts)}, ensure_ascii=False))
