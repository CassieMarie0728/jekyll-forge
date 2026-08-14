from pathlib import Path

from PIL import Image

ROOT = Path("/home/ubuntu/jekyll-forge/mobile/jekyll-forge-mobile")
ASSETS = ROOT / "assets"
SOURCE_SPLASH = Path("/tmp/jekyll-forge-splash-original.png")
SOURCE_ICON = Path("/tmp/jekyll-forge-playstore-original.png")
SOURCE_FOREGROUND = ASSETS / "adaptive-icon.png"


def optimize_splash() -> None:
    """Create a 2048px lossless derivative without altering the supplied original."""
    splash = Image.open(SOURCE_SPLASH).convert("RGB")
    splash.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
    target = ASSETS / "splash.png"
    splash.save(target, "PNG", optimize=True, compress_level=9)
    if target.stat().st_size >= 1_000_000:
        raise RuntimeError("Optimized splash still exceeds the checkpoint media limit.")


def prepare_notification_icon() -> None:
    foreground = Image.open(SOURCE_FOREGROUND).convert("RGBA")
    notification = Image.new("RGBA", foreground.size, (255, 255, 255, 0))
    notification.putalpha(foreground.getchannel("A"))
    notification.thumbnail((96, 96), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (96, 96), (255, 255, 255, 0))
    offset = ((96 - notification.width) // 2, (96 - notification.height) // 2)
    canvas.alpha_composite(notification, offset)
    canvas.save(ASSETS / "notification-icon.png", "PNG", optimize=True)


ASSETS.mkdir(parents=True, exist_ok=True)
Image.open(SOURCE_ICON).convert("RGBA").save(ASSETS / "icon.png", "PNG", optimize=True)
optimize_splash()
prepare_notification_icon()
