#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CHARACTERS_FILE = PROJECT_ROOT / "src/data/characters.v2.json"
IMAGES_DIR = PROJECT_ROOT / "public/characters"
WIKI_API = "https://onepiece.fandom.com/api.php"
USER_AGENT = "OnePiecedleScraper/1.0 (contact: onepiecedle@example.com)"
RATE_LIMIT = 1.0


def load_characters():
    with open(CHARACTERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_image_url(character_name: str) -> Optional[str]:
    search_names = [
        character_name.replace(" ", "_"),
        character_name.replace(" ", "") + ".png",
        character_name + ".png",
    ]

    for search_name in search_names:
        search_params = {
            "action": "query",
            "titles": f"File:{search_name}",
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json",
        }

        query_string = "&".join(f"{k}={urllib.parse.quote(v)}" for k, v in search_params.items())
        url = f"{WIKI_API}?{query_string}"

        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))

            pages = data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id == "-1":
                    continue
                image_info = page_data.get("imageinfo", [])
                if image_info:
                    return image_info[0].get("url")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
            pass

    search_params = {
        "action": "opensearch",
        "search": f"File:{character_name}",
        "limit": "5",
        "format": "json",
    }

    query_string = "&".join(f"{k}={urllib.parse.quote(v)}" for k, v in search_params.items())
    url = f"{WIKI_API}?{query_string}"

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

        if len(data) > 1 and data[1]:
            for title in data[1]:
                if title.startswith("File:"):
                    file_name = title.replace("File:", "")
                    search_params = {
                        "action": "query",
                        "titles": f"File:{file_name}",
                        "prop": "imageinfo",
                        "iiprop": "url",
                        "format": "json",
                    }
                    query_string = "&".join(f"{k}={urllib.parse.quote(v)}" for k, v in search_params.items())
                    url = f"{WIKI_API}?{query_string}"

                    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                    with urllib.request.urlopen(req, timeout=10) as response:
                        data = json.loads(response.read().decode("utf-8"))

                    pages = data.get("query", {}).get("pages", {})
                    for page_id, page_data in pages.items():
                        if page_id == "-1":
                            continue
                        image_info = page_data.get("imageinfo", [])
                        if image_info:
                            return image_info[0].get("url")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        pass

    return None


def download_image(url: str, dest_path: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            image_data = response.read()

        with open(dest_path, "wb") as f:
            f.write(image_data)

        return True
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"  Failed to download: {e}")
        return False


def main():
    print("Loading characters from JSON...")
    characters = load_characters()
    print(f"Found {len(characters)} characters in dataset")

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    existing_images = set(p.stem for p in IMAGES_DIR.glob("*.png"))
    print(f"Existing images: {len(existing_images)}")

    missing = [c for c in characters if c["id"] not in existing_images]
    print(f"Characters missing images: {len(missing)}")

    if not missing:
        print("All characters already have images!")
        return

    downloaded = 0
    failed = 0

    for i, char in enumerate(missing):
        char_id = char["id"]
        char_name = char["name"]
        dest_path = IMAGES_DIR / f"{char_id}.png"

        print(f"[{i+1}/{len(missing)}] {char_name} ({char_id})...", end=" ")

        image_url = get_image_url(char_name)

        if image_url and download_image(image_url, dest_path):
            print("OK")
            downloaded += 1
        else:
            print("SKIPPED")
            failed += 1

        time.sleep(RATE_LIMIT)

    print(f"\nDone! Downloaded: {downloaded}, Failed: {failed}")

    final_count = len(list(IMAGES_DIR.glob("*.png")))
    print(f"Total images now: {final_count}")


if __name__ == "__main__":
    main()
