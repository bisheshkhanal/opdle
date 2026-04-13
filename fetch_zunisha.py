import urllib.request
import urllib.parse
import json
import re

url = "https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&titles=Zunesha&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    pages = data.get("query", {}).get("pages", {})
    for page_id, page_info in pages.items():
        content = page_info.get("revisions", [])[0].get("*", "")
        # print first 2000 chars
        print(content[:2000])
