import urllib.request
import urllib.parse
import json

url = "https://onepiece.fandom.com/api.php?action=query&list=search&srsearch=Joseph+live+action&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    for res in data.get("query", {}).get("search", []):
        print(res["title"])
