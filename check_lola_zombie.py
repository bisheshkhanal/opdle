import urllib.request
import urllib.parse
import json

for title in ["Lola (Zombie)", "Charlotte Lola"]:
    url = f"https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&titles={urllib.parse.quote(title)}&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        pages = data.get("query", {}).get("pages", {})
        for page_id, page_info in pages.items():
            content = page_info.get("revisions", [])[0].get("*", "")
            lines = [line.strip() for line in content.split('\n') if 'height' in line.lower()]
            print(f"--- {title} ---")
            for line in lines:
                print(line)
