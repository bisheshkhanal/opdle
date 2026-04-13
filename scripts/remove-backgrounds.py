#!/usr/bin/env python3
"""
Remove backgrounds from character images so they all have transparent backgrounds.
This ensures consistent silhouette rendering in the Bounty Board (brightness-0 filter).

Only processes images that lack real transparency (RGB mode or fully-opaque RGBA).
Skips images that already have transparent pixels — they're already correct.

Usage:
    python3 scripts/remove-backgrounds.py
    python3 scripts/remove-backgrounds.py --dry-run      # Preview which files would be processed
    python3 scripts/remove-backgrounds.py --force        # Reprocess ALL images, even transparent ones
"""

import argparse
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
IMAGES_DIR = PROJECT_ROOT / "public" / "characters"


def needs_background_removal(image_path: Path) -> bool:
    with Image.open(image_path) as img:
        if img.mode != "RGBA":
            return True
        arr = np.array(img)
        has_transparency = (arr[:, :, 3] < 255).any()
        return not has_transparency


def remove_background(image_path: Path) -> Image.Image:
    from rembg import remove

    with open(image_path, "rb") as f:
        input_data = f.read()
    output_data = remove(input_data)

    from io import BytesIO

    return Image.open(BytesIO(output_data)).convert("RGBA")


def main() -> None:
    parser = argparse.ArgumentParser(description="Remove backgrounds from character images.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List images that would be processed without actually modifying them.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocess ALL images, even those already transparent.",
    )
    args = parser.parse_args()

    if not IMAGES_DIR.exists():
        print(f"Error: images directory not found: {IMAGES_DIR}", file=sys.stderr)
        sys.exit(1)

    all_pngs = sorted(IMAGES_DIR.glob("*.png"))
    if not all_pngs:
        print("No PNG images found. Run npm run setup:images first.")
        return

    if args.force:
        to_process = all_pngs
    else:
        to_process = [p for p in all_pngs if needs_background_removal(p)]

    already_ok = len(all_pngs) - len(to_process)
    print(f"Total images:          {len(all_pngs)}")
    print(f"Already transparent:   {already_ok} (skipped)")
    print(f"Needs processing:      {len(to_process)}")

    if not to_process:
        print("\nAll images already have transparent backgrounds. Nothing to do.")
        return

    if args.dry_run:
        print("\nDry run — images that would be processed:")
        for p in to_process:
            print(f"  {p.name}")
        return

    print("\nStarting background removal (first run downloads the AI model ~170 MB)...\n")

    succeeded = 0
    failed = 0

    for i, image_path in enumerate(to_process, 1):
        label = f"[{i}/{len(to_process)}] {image_path.name}"
        print(f"{label}...", end=" ", flush=True)
        try:
            result = remove_background(image_path)
            result.save(image_path, format="PNG")
            print("OK")
            succeeded += 1
        except Exception as exc:
            print(f"FAILED ({exc})")
            failed += 1

    print(f"\nDone. Processed: {succeeded}, Failed: {failed}")
    if failed:
        print(f"Warning: {failed} image(s) could not be processed. They will still show as solid black squares.")


if __name__ == "__main__":
    main()
