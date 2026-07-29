"""
Generates SaveNest's PWA icons, favicon, apple-touch-icon, and OG cover image
using only Pillow (no network access, no external image-generation tool).
The mark is the same "arrow into a nest/tray" glyph used in Header.tsx,
rendered flat so it reads clearly at small sizes.

This is a dev-only utility — it is never run during `npm install`, `npm run
build`, or the Netlify deploy pipeline, so it has no effect on the deployed
app. Re-run it only when you want to regenerate the icon set (e.g. after
changing the brand mark or color).

Usage:
    pip install -r scripts/requirements.txt
    python3 scripts/generate-icons.py
"""

from PIL import Image, ImageDraw, ImageFont

BRAND = (37, 99, 235)  # #2563eb
BRAND_DARK = (29, 78, 216)  # #1d4ed8
WHITE = (255, 255, 255)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def rounded_square(size: int, radius_ratio: float = 0.22, bg=BRAND) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg)
    return img


def draw_mark(img: Image.Image, size: int, color=WHITE, stroke_ratio: float = 0.09):
    """Draws the arrow-into-tray glyph centered in `img`."""
    draw = ImageDraw.Draw(img)
    stroke = max(2, int(size * stroke_ratio))
    cx = size / 2
    top = size * 0.22
    bottom = size * 0.56
    # Vertical shaft
    draw.line([(cx, top), (cx, bottom)], fill=color, width=stroke)
    # Arrow head
    head_w = size * 0.16
    draw.line([(cx - head_w, bottom - head_w), (cx, bottom)], fill=color, width=stroke)
    draw.line([(cx + head_w, bottom - head_w), (cx, bottom)], fill=color, width=stroke)
    # Tray (rounded open bracket at the bottom)
    tray_y = size * 0.72
    tray_half = size * 0.22
    tray_drop = size * 0.08
    draw.line([(cx - tray_half, tray_y), (cx - tray_half, tray_y + tray_drop)], fill=color, width=stroke)
    draw.line([(cx + tray_half, tray_y), (cx + tray_half, tray_y + tray_drop)], fill=color, width=stroke)
    draw.arc(
        [cx - tray_half, tray_y + tray_drop - tray_half, cx + tray_half, tray_y + tray_drop + tray_half],
        start=0,
        end=180,
        fill=color,
        width=stroke,
    )


def make_icon(size: int, radius_ratio: float = 0.22) -> Image.Image:
    img = rounded_square(size, radius_ratio=radius_ratio)
    draw_mark(img, size)
    return img


def make_maskable_icon(size: int) -> Image.Image:
    # Maskable icons need the safe zone (the mark) inside ~80% of the canvas,
    # with the background filling the full square edge-to-edge (no rounding,
    # since the OS applies its own mask shape).
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, size - 1, size - 1], fill=BRAND)
    inner = Image.new("RGBA", (int(size * 0.7), int(size * 0.7)), (0, 0, 0, 0))
    draw_mark(inner, inner.size[0])
    offset = ((size - inner.size[0]) // 2, (size - inner.size[1]) // 2)
    img.alpha_composite(inner, offset)
    return img


def make_og_cover(path: str):
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), (248, 250, 252))  # mist-50
    draw = ImageDraw.Draw(img)

    # Soft gradient band on the left using vertical brand-tinted stripes
    for x in range(0, w):
        t = x / w
        r = int(248 + (37 - 248) * min(1, t * 1.4))
        g = int(250 + (99 - 250) * min(1, t * 1.4))
        b = int(252 + (235 - 252) * min(1, t * 1.4))
        draw.line([(x, 0), (x, h)], fill=(r, g, b))
    # Re-overlay a translucent white panel on the right two-thirds for text legibility
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.rectangle([int(w * 0.32), 0, w, h], fill=(255, 255, 255, 235))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Logo badge
    badge_size = 96
    badge = make_icon(badge_size, radius_ratio=0.28)
    img.paste(badge, (80, 80), badge)

    # Text
    title_font = ImageFont.truetype(FONT_BOLD, 64)
    subtitle_font = ImageFont.truetype(FONT_REGULAR, 30)

    draw.text((80, 210), "SaveNest", font=title_font, fill=(15, 23, 42))
    draw.text(
        (80, 300),
        "Download video TikTok, Instagram & YouTube",
        font=subtitle_font,
        fill=(30, 41, 59),
    )
    draw.text((80, 344), "tanpa watermark, langsung dari browser.", font=subtitle_font, fill=(30, 41, 59))

    # Platform chips
    chip_font = ImageFont.truetype(FONT_BOLD, 22)
    chips = ["TikTok", "Instagram", "YouTube"]
    cx = 80
    for chip in chips:
        bbox = draw.textbbox((0, 0), chip, font=chip_font)
        tw = bbox[2] - bbox[0]
        chip_w = tw + 48
        draw.rounded_rectangle([cx, 420, cx + chip_w, 420 + 48], radius=24, fill=(37, 99, 235, 25) if False else (219, 234, 254))
        draw.text((cx + 24, 434), chip, font=chip_font, fill=(29, 78, 216))
        cx += chip_w + 16

    img.save(path, "PNG")


def main():
    out = "public/icons"
    import os

    os.makedirs(out, exist_ok=True)

    sizes = [16, 32, 48, 96, 180, 192, 256, 384, 512]
    for s in sizes:
        make_icon(s).save(f"{out}/icon-{s}.png")

    # Apple touch icon (opaque background required by iOS — flatten alpha)
    apple = make_icon(180).convert("RGBA")
    flat = Image.new("RGB", apple.size, BRAND)
    flat.paste(apple, mask=apple.split()[3])
    flat.save(f"{out}/apple-touch-icon.png")

    # Maskable icon for Android adaptive icons
    make_maskable_icon(512).save(f"{out}/maskable-icon-512.png")

    # Multi-resolution favicon.ico
    make_icon(256).save(
        f"{out}/favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    make_og_cover(f"{out}/og-cover.png")
    print("Icons generated in", out)


if __name__ == "__main__":
    main()
