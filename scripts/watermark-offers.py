#!/usr/bin/env python3
"""Stamp published offer copies with three horizontal PiBridge brand marks.

Unstamped copies are retained in ignored qa/offer-originals and are not published.
Existing stamps are never applied twice. A replacement retains its original pixels.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'assets/published-offers.json'
BACKUPS = ROOT / 'qa/offer-originals'
STYLE = {'text': 'PiBridge', 'rows': 3, 'style': 'horizontal-brand-wordmark', 'opacity': 0.14, 'version': 1}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def stamp(image, wordmark):
    """Multiply a light mark into the document so dark text stays dark."""
    width, height = image.size
    mark = wordmark.copy()
    scale = min(width * .45 / mark.width, height * .18 / mark.height)
    mark = mark.resize((max(1, round(mark.width * scale)), max(1, round(mark.height * scale))), Image.Resampling.LANCZOS)
    mark = Image.blend(Image.new('RGB', mark.size, 'white'), mark, STYLE['opacity'])
    pattern = Image.new('RGB', image.size, 'white')
    for y in (.25, .50, .75):
        pattern.paste(mark, ((width - mark.width) // 2, round(height * y - mark.height / 2)))
    return ImageChops.multiply(image, pattern), pattern


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--replace-cuhk-math', type=Path)
    args = parser.parse_args()
    offers = json.loads(MANIFEST.read_text())
    BACKUPS.mkdir(parents=True, exist_ok=True)
    with Image.open(ROOT / 'assets/brand/wordmark.png') as raw:
        wordmark = raw.convert('RGB')
    backup_by_hash = {sha(path.read_bytes()): path for path in BACKUPS.iterdir() if path.is_file()}
    pending = []
    checked = 0
    for offer in offers:
        current = ROOT / offer['image']
        replacement = args.replace_cuhk_math if offer['school'] == '香港中文大学' and offer['programme'] == 'MSc Mathematics' else None
        if offer.get('watermark') == STYLE and not replacement:
            if sha(current.read_bytes()) != offer['sha256']:
                raise ValueError(f'Published copy changed: {current.name}')
            continue
        source = replacement or (backup_by_hash.get(offer.get('sourceSha256')) if offer.get('watermark') else current)
        if source is None:
            raise ValueError(f'Missing unstamped backup: {current.name}')
        source_bytes = source.read_bytes()
        source_name = current.stem.removesuffix('-pibridge') + ('.png' if replacement else current.suffix)
        backup = BACKUPS / source_name
        if backup.exists() and backup.read_bytes() != source_bytes:
            backup = BACKUPS / f'{Path(source_name).stem}-{sha(source_bytes)[:10]}{Path(source_name).suffix}'
        if source.parent != BACKUPS and not backup.exists():
            shutil.copyfile(source, backup)
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw).convert('RGB')
        result, pattern = stamp(image, wordmark)
        # The operation cannot erase or brighten any source pixel.
        assert ImageChops.subtract(result, image).getbbox() is None
        changed = ImageChops.difference(result, image)
        r, g, b = pattern.split()
        inverse_mask = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda p: 255 if p == 255 else 0)
        assert ImageChops.multiply(changed, inverse_mask.convert('RGB')).getbbox() is None
        target = current.with_name(current.stem.removesuffix('-pibridge') + '-pibridge.png')
        result.save(target, format='PNG', optimize=True)
        with Image.open(target) as saved:
            assert saved.size == image.size
            assert ImageChops.difference(saved.convert('RGB'), result).getbbox() is None
        offer['image'] = target.relative_to(ROOT).as_posix()
        offer['sha256'] = sha(target.read_bytes())
        offer['sourceSha256'] = sha(source_bytes)
        offer['watermark'] = STYLE.copy()
        if current != target:
            pending.append(current)
        checked += 1
    MANIFEST.write_text(json.dumps(offers, ensure_ascii=False, indent=2) + '\n')
    for path in pending:
        path.unlink()
    print(f'Stamped {checked} copies; {len(offers)} offers total. Backups: {BACKUPS}')


if __name__ == '__main__':
    main()
