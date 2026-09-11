from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).parent


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    family = "segoeuib.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(f"C:/Windows/Fonts/{family}", size=size)


# Tapiz Boards "Niti" glyph (EcosystemLogoMark variant="boards", 48-unit grid):
# 3 vertical ink bars (barPath "M13 10 V34 M24 8 V28 M35 14 V40") crossed by one
# horizontal purple accent thread (accentPath "M6 24 H42"), halo punches the gaps.
def draw_logo(draw: ImageDraw.ImageDraw, center: tuple[int, int], scale: float, ink: str, halo: str, accent: str) -> None:
    cx, cy = center
    origin_x = cx - round(24 * scale)
    origin_y = cy - round(24 * scale)

    def p(x: float, y: float) -> tuple[float, float]:
        return (origin_x + x * scale, origin_y + y * scale)

    def vbar(x: float, y1: float, y2: float, color: str, width: float) -> None:
        w = round(width * scale)
        r = w / 2
        a, b = p(x, y1), p(x, y2)
        draw.line([a, b], fill=color, width=w)
        draw.ellipse((a[0] - r, a[1] - r, a[0] + r, a[1] + r), fill=color)
        draw.ellipse((b[0] - r, b[1] - r, b[0] + r, b[1] + r), fill=color)

    def hbar(y: float, x1: float, x2: float, color: str, width: float) -> None:
        w = round(width * scale)
        r = w / 2
        a, b = p(x1, y), p(x2, y)
        draw.line([a, b], fill=color, width=w)
        draw.ellipse((a[0] - r, a[1] - r, a[0] + r, a[1] + r), fill=color)
        draw.ellipse((b[0] - r, b[1] - r, b[0] + r, b[1] + r), fill=color)

    vbar(13, 10, 34, ink, 9)
    vbar(24, 8, 28, ink, 9)
    vbar(35, 14, 40, ink, 9)
    hbar(24, 6, 42, halo, 15)
    hbar(24, 6, 42, accent, 9)


TILE_BG = "#F6F4FA"
TILE_BORDER = "#E7E2F0"
INK = "#221C30"
ACCENT = "#7759C2"


def create_og_image() -> None:
    image = Image.new("RGB", (1200, 630), "#FFFFFF").convert("RGBA")

    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((760, -260, 1420, 340), fill=(119, 89, 194, 45))
    glow_draw.ellipse((-260, 340, 380, 900), fill=(119, 89, 194, 30))
    image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(120)))

    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((100, 165, 400, 465), radius=72, fill=TILE_BG, outline=TILE_BORDER, width=3)
    draw_logo(draw, (250, 315), 4.3, INK, TILE_BG, ACCENT)

    draw.text((460, 210), "Tapiz Boards", font=font(84, bold=True), fill="#171321")
    draw.text(
        (464, 320),
        "Zadaci i tabla za tim\nna jednom mestu.",
        font=font(34),
        fill="#5A5566",
        spacing=14,
    )

    image.convert("RGB").save(OUT / "og-image.png", optimize=True)


if __name__ == "__main__":
    create_og_image()
