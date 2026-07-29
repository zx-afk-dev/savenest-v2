"""
Regenerates SaveNest's PWA icons, favicon, apple-touch-icon, and OG cover
image from the real uploaded logo (cloud + download arrow + nest + leaf,
"Save Nest" wordmark), instead of the earlier placeholder glyph drawn in
generate-icons.py. Pure Pillow, no network access.
"""

import os
from PIL import Image, ImageDraw, ImageFont

SRC_LOGO = "/mnt/user-data/uploads/471798.png"
OUT_DIR = "public/icons"

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Bounding box of just the icon mark (cloud/arrow/nest/leaf) within the
# uploaded 1254x1254 source image, excluding the "Save Nest" wordmark and
# tagline below it. Found by scanning rows/cols for non-white pixels.
ICON_BBOX = (280, 195, 970, 815)  # left, top, right, bottom (with a little padding)


def load_icon_mark() -> Image.Image:
    src = Image.open(SRC_LOGO).convert("RGB")
    cropped = src.crop(ICON_BBOX)

    # Pad to a square canvas (white background, matching the source's own
    # background) so every generated size is a clean square, not stretched.
    w, h = cropped.size
    side = max(w, h)
    square = Image.new("RGB", (side, side), (255, 255, 255))
    square.paste(cropped, ((side - w) // 2, (side - h) // 2))
    return square


def make_icon(mark: Image.Image, size: int) -> Image.Image:
    return mark.resize((size, size), Image.LANCZOS)


def make_maskable_icon(mark: Image.Image, size: int) -> Image.Image:
    # Maskable icons need their content within the safe zone (~center 70%)
    # on a background that fills the full canvas edge-to-edge, since the OS
    # applies its own mask shape (circle, squircle, etc.) on top.
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    inner_size = int(size * 0.72)
    inner = mark.resize((inner_size, inner_size), Image.LANCZOS)
    offset = ((size - inner_size) // 2, (size - inner_size) // 2)
    canvas.paste(inner, offset)
    return canvas


def make_og_cover(path: str):
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), (248, 250, 252))  # mist-50
    draw = ImageDraw.Draw(img)

    # Soft brand-tinted gradient background
    for y in range(h):
        t = y / h
        r = int(248 + (239 - 248) * t)
        g = int(250 + (246 - 250) * t)
        b = int(252 + (255 - 252) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Full logo (icon + wordmark + tagline), as uploaded, centered
    logo = Image.open(SRC_LOGO).convert("RGB")
    logo_h = 560
    logo_w = int(logo.size[0] * (logo_h / logo.size[1]))
    logo_resized = logo.resize((logo_w, logo_h), Image.LANCZOS)
    img.paste(logo_resized, ((w - logo_w) // 2, (h - logo_h) // 2 - 15))

    # Platform chips along the bottom
    chip_font = ImageFont.truetype(FONT_BOLD, 22)
    chips = ["TikTok", "Instagram", "YouTube"]
    total_w = 0
    chip_widths = []
    for chip in chips:
        bbox = draw.textbbox((0, 0), chip, font=chip_font)
        cw = (bbox[2] - bbox[0]) + 48
        chip_widths.append(cw)
        total_w += cw + 16
    total_w -= 16
    cx = (w - total_w) // 2
    for chip, cw in zip(chips, chip_widths):
        draw.rounded_rectangle([cx, 572, cx + cw, 572 + 44], radius=22, fill=(219, 234, 254))
        bbox = draw.textbbox((0, 0), chip, font=chip_font)
        tw = bbox[2] - bbox[0]
        draw.text((cx + (cw - tw) / 2, 583), chip, font=chip_font, fill=(29, 78, 216))
        cx += cw + 16

    img.save(path, "PNG")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    mark = load_icon_mark()

    sizes = [16, 32, 48, 96, 180, 192, 256, 384, 512]
    for s in sizes:
        make_icon(mark, s).save(f"{OUT_DIR}/icon-{s}.png")

    # Apple touch icon: iOS applies its own rounding, so ship a plain
    # opaque square.
    make_icon(mark, 180).save(f"{OUT_DIR}/apple-touch-icon.png")

    make_maskable_icon(mark, 512).save(f"{OUT_DIR}/maskable-icon-512.png")

    make_icon(mark, 256).save(
        f"{OUT_DIR}/favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    make_og_cover(f"{OUT_DIR}/og-cover.png")
    print("Icons regenerated from uploaded logo in", OUT_DIR)


if __name__ == "__main__":
    main()
