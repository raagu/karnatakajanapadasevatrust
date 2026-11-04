"""Isolated maintenance tests; no network calls or live cache modifications."""
import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

try:
    from PIL import Image
except ImportError:
    Image = None

spec = importlib.util.spec_from_file_location('refresh_media', Path(__file__).resolve().parents[1] / 'scripts/refresh-media.py')
refresh_media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh_media)


class Response(io.BytesIO):
    url = 'https://upload.wikimedia.org/wikipedia/commons/test.jpg'


@unittest.skipIf(Image is None, 'Optional Pillow dependency is not installed')
class RefreshMediaTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / 'public'
        (self.root / 'images').mkdir(parents=True)
        buffer = io.BytesIO()
        Image.new('RGB', (1600, 1000), 'red').save(buffer, format='JPEG')
        self.photo = buffer.getvalue()

    def prepare(self, ids):
        items = []
        for identifier in ids:
            items.append({'id': identifier, 'local': f'/images/{identifier}.jpg',
                          'original': f'https://upload.wikimedia.org/{identifier}.jpg',
                          'license': 'CC BY-SA 4.0'})
            (self.root / 'images' / f'{identifier}.jpg').write_bytes(b'previous cached photo')
        (self.root / 'media.json').write_text(json.dumps(items))
        return {str(path.relative_to(self.root)): path.read_bytes()
                for path in self.root.rglob('*') if path.is_file()}

    def test_rate_limit_after_first_download_retains_entire_cache(self):
        before = self.prepare(['dollu', 'puppetry'])
        error = HTTPError('https://upload.wikimedia.org/puppetry.jpg', 429, 'Too many requests', {}, None)
        stderr, stdout = io.StringIO(), io.StringIO()
        with patch.object(refresh_media, 'urlopen', side_effect=[Response(self.photo), error]) as request:
            with contextlib.redirect_stderr(stderr), contextlib.redirect_stdout(stdout):
                result = refresh_media.refresh(self.root)
        after = {str(path.relative_to(self.root)): path.read_bytes()
                 for path in self.root.rglob('*') if path.is_file()}
        self.assertEqual(result, 2)
        self.assertEqual(request.call_count, 2)  # No immediate retry.
        self.assertEqual(after, before)
        self.assertIn('rate-limited', stderr.getvalue())
        self.assertIn('Cached media retained', stderr.getvalue())
        self.assertNotIn('Refreshed', stdout.getvalue())

    def test_success_updates_variant_dimensions_and_preserves_metadata(self):
        self.prepare(['dollu', 'yakshagana-hero'])
        with patch.object(refresh_media, 'urlopen', side_effect=lambda *args, **kwargs: Response(self.photo)):
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(refresh_media.refresh(self.root), 0)
        gallery, hero = json.loads((self.root / 'media.json').read_text())
        self.assertEqual(gallery['variants'], [
            {'src': '/images/dollu.jpg', 'width': 1200, 'height': 750},
            {'src': '/images/dollu-640.jpg', 'width': 640, 'height': 400}])
        self.assertEqual(hero['variants'], [
            {'src': '/images/yakshagana-hero.jpg', 'width': 1600, 'height': 1000},
            {'src': '/images/yakshagana-hero-800.jpg', 'width': 800, 'height': 500}])
        self.assertEqual((hero['width'], hero['height']), (1600, 1000))
        self.assertEqual(hero['license'], 'CC BY-SA 4.0')
        with Image.open(self.root / 'images/social-card.jpg') as social:
            self.assertEqual(social.size, (1200, 630))


if __name__ == '__main__':
    unittest.main()
