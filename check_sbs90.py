import urllib.request
import urllib.parse
import json

url = "https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&titles=SBS_Volume_90&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    pages = data.get("query", {}).get("pages", {})
    for page_id, page_info in pages.items():
        content = page_info.get("revisions", [])[0].get("*", "")
        if "height" in content.lower() or "tall" in content.lower():
            lines = [line for line in content.split('\n') if 'height' in line.lower() or 'tall' in line.lower()]
            for line in lines:
                print(line)
