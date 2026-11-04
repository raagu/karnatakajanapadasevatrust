"""Refresh reviewed Wikimedia photographs without changing cache on download failure.

Optional dependency: Pillow. Original licenses remain applicable. Review
public/media.json before running. No keyword searches or automatic retries occur.
"""
import io
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


class RefreshError(Exception):
    """A refresh that must retain all previously cached media."""


def reviewed_url(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname != 'upload.wikimedia.org':
        raise RefreshError('Only reviewed HTTPS Wikimedia upload URLs are allowed.')
    return url


def local_target(root, local):
    relative = Path(local.lstrip('/'))
    if relative.parent != Path('images') or relative.name in ('.', '..'):
        raise RefreshError('Image must remain in the local images directory.')
    target = root / relative
    if target.is_symlink() or (root / 'images').is_symlink():
        raise RefreshError('Cached image paths must not be symbolic links.')
    return target


def commit_staged(staged, directory):
    """Replace only a complete batch; restore prior files if replacement fails."""
    backups = {}
    changed = []
    for index, (_, target) in enumerate(staged):
        backup = directory / f'backup-{index}'
        if target.exists():
            shutil.copy2(target, backup)
            backups[target] = backup
        else:
            backups[target] = None
    try:
        for source, target in staged:
            os.replace(source, target)
            changed.append(target)
    except OSError:
        for target in reversed(changed):
            backup = backups[target]
            if backup is None:
                target.unlink(missing_ok=True)
            else:
                os.replace(backup, target)
        raise


def refresh(root):
    """Return 0 on complete refresh, or 2 while preserving an incomplete batch."""
    root = Path(root).resolve()
    try:
        from PIL import Image, ImageOps
        manifest_path = root / 'media.json'
        manifest = json.loads(manifest_path.read_text())
        staged = []
        refreshed = []
        with tempfile.TemporaryDirectory(prefix='.kjst-media-', dir=root.parent) as temporary:
            stage = Path(temporary)
            for item in manifest:
                original = item.get('original')
                if not original:
                    continue
                original = reviewed_url(original)
                target = local_target(root, item['local'])
                request = Request(original, headers={'User-Agent': 'KJST-media-maintenance/1.0'})
                with urlopen(request, timeout=45) as response:
                    reviewed_url(response.url)
                    payload = response.read(25_000_001)
                if len(payload) > 25_000_000:
                    raise RefreshError('Source image exceeds the maintenance size limit.')
                with Image.open(io.BytesIO(payload)) as source:
                    image = ImageOps.exif_transpose(source).convert('RGB')
                hero = item['id'] == 'yakshagana-hero'
                variants = []
                sizes = [(1600 if hero else 1200, target),
                         (800 if hero else 640, target.with_stem(target.stem + ('-800' if hero else '-640')))]
                for width, filename in sizes:
                    if image.width < width:
                        raise RefreshError(f'Source is too small for {filename.name}; do not upscale.')
                    resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
                    staged_path = stage / f'{len(staged)}.jpg'
                    resized.save(staged_path, quality=86, optimize=True)
                    staged.append((staged_path, filename))
                    variants.append({'src': '/images/' + filename.name,
                                     'width': resized.width, 'height': resized.height})
                item['width'], item['height'] = variants[0]['width'], variants[0]['height']
                item['variants'] = variants
                if hero:
                    social_path = stage / f'{len(staged)}.jpg'
                    ImageOps.fit(image, (1200, 630), centering=(.5, .3)).save(social_path, quality=86, optimize=True)
                    staged.append((social_path, local_target(root, '/images/social-card.jpg')))
                refreshed.append(f'Refreshed {target.name}; {item["license"]}')
            staged_manifest = stage / 'media.json'
            staged_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
            staged.append((staged_manifest, manifest_path))
            if len({target for _, target in staged}) != len(staged):
                raise RefreshError('The reviewed manifest contains overlapping output paths.')
            commit_staged(staged, stage)
        for line in refreshed:
            print(line)
        print(f'Media refresh complete: {len(refreshed)} reviewed photographs.')
        return 0
    except HTTPError as error:
        detail = ('Wikimedia rate-limited the request (HTTP 429); try maintenance later.'
                  if error.code == 429 else f'Image source returned HTTP {error.code}.')
    except ImportError:
        detail = 'Pillow is required; run this command in an environment with Pillow installed.'
    except (OSError, ValueError, KeyError, TypeError, RefreshError) as error:
        detail = str(error)
    print(f'Refresh incomplete: {detail} Cached media retained; no completed refresh was published.', file=sys.stderr)
    return 2


def main():
    return refresh(Path(__file__).resolve().parent.parent / 'public')


if __name__ == '__main__':
    raise SystemExit(main())
