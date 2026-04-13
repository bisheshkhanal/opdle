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
    "Laboon",
    "Lola",
    "Miss Father's Day",
    "Miss Monday",
    "Oars",
    "Jaygarcia Saturn",
    "Scopper Gaban",
    "Zunisha"
]

url_base = "https://onepiece.fandom.com/api.php"

results = {}

for char in characters:
    params = {
        "action": "query",
        "prop": "revisions",
        "rvprop": "content",
        "titles": char,
        "format": "json"
    }
    
    query_string = urllib.parse.urlencode(params)
    url = f"{url_base}?{query_string}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            pages = data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                if page_id == "-1":
                    results[char] = "Page not found"
                    continue
                    
                revisions = page_info.get("revisions", [])
                if not revisions:
                    results[char] = "No revisions found"
                    continue
                    
                content = revisions[0].get("*", "")
                
                # Find all lines containing "|height" or "| height"
                height_lines = [line for line in content.split('\n') if re.search(r'\|\s*height\s*=', line, re.IGNORECASE)]
                
                if height_lines:
                    results[char] = height_lines
                else:
                    results[char] = "No height line found"
                    
    except Exception as e:
        results[char] = f"Error: {str(e)}"

print(json.dumps(results, indent=2))
