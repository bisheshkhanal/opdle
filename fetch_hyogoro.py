import urllib.request
import json
import re

url = "https://onepiece.fandom.com/api.php?action=parse&page=Hyogoro&format=json&prop=text"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    html = data['parse']['text']['*']
    match = re.search(r'(\d+)\s*cm', html)
    if match:
        print(f"Hyogoro height: {match.group(1)}")
    else:
        print("Not found")
