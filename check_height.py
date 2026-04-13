import urllib.request
import urllib.parse
import json
import re

characters = [
    "Babanuki",
    "Bogard",
    "Cerberus",
    "Donquixote Homing",
    "Gloriosa",
    "Joseph",
    "Lola",
    "Miss Father's Day",
    "Miss Monday",
    "Jaygarcia Saturn",
    "Scopper Gaban"
]

for char in characters:
    url = f"https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&titles={urllib.parse.quote(char)}&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                content = page_info.get("revisions", [])[0].get("*", "")
                
                # Find any line with "height" in it
                lines = [line.strip() for line in content.split('\n') if 'height' in line.lower()]
                print(f"--- {char} ---")
                for line in lines:
                    print(line)
    except Exception as e:
        print(f"Error for {char}: {e}")
