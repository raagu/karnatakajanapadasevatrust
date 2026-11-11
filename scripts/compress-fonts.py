"""Regenerate self-hosted WOFF2 files; requires the optional fonttools[woff] package."""

from pathlib import Path
from tempfile import TemporaryDirectory

from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress


def compress_fonts():
    fonts = Path(__file__).resolve().parents[1] / "public" / "fonts"
    originals = sorted(fonts.glob("*.ttf"))
    if not originals:
        raise RuntimeError("No original TTF files found.")
    original_bytes = compressed_bytes = 0
    with TemporaryDirectory(prefix="kjst-fonts-") as temporary:
        staged = []
        for source in originals:
            target = Path(temporary) / source.with_suffix(".woff2").name
            compress(source, target)
            with TTFont(source) as original, TTFont(target) as compressed:
                if (
                    original.getBestCmap() != compressed.getBestCmap()
                    or original.getGlyphOrder() != compressed.getGlyphOrder()
                    or original["hmtx"].metrics != compressed["hmtx"].metrics
                    or any(
                        getattr(original["hhea"], metric)
                        != getattr(compressed["hhea"], metric)
                        for metric in ("ascent", "descent", "lineGap")
                    )
                ):
                    raise RuntimeError(f"Font glyphs or metrics changed: {source.name}")
            original_bytes += source.stat().st_size
            compressed_bytes += target.stat().st_size
            staged.append((target, source.with_suffix(".woff2")))
        # Validate the complete set before replacing any published font.
        for source, destination in staged:
            destination.write_bytes(source.read_bytes())
    print(
        f"Verified {len(originals)} fonts: "
        f"{original_bytes:,} TTF bytes → {compressed_bytes:,} WOFF2 bytes."
    )


if __name__ == "__main__":
    compress_fonts()
