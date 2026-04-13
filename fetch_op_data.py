import urllib.request
import json
import time
import re

characters = [
    "Kuro", "Don Krieg", "Morgan", "Karoo", "Galdino", "Blueno", "Edward Weevil", 
    "Tama", "Trebol", "Diamante", "Pica", "Sugar", "Senor Pink", "Charlotte Brulee", 
    "Ryuma", "Zeus", "Zeff", "Bell-mere", "Kuina", "Imu", "Hannyabal", "Makino", 
    "Curly Dadan", "Fisher Tiger", "Viola", "Hyogoro", "York", "T-Bone", 
    "Vander Decken IX", "Wanda", "Otohime"
]

results = {}

for char in characters:
    url = f"https://onepiece.fandom.com/api.php?action=parse&page={urllib.parse.quote(char.replace(' ', '_'))}&format=json&prop=text"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        if 'parse' not in data:
            print(f"Failed to parse {char}")
            continue
            
        html = data['parse']['text']['*']
        
        # Extract infobox
        infobox_match = re.search(r'<aside class="portable-infobox.*?</aside>', html, re.DOTALL)
        char_data = {}
        
        if infobox_match:
            infobox = infobox_match.group(0)
            
            # Find all pi-item rows
            items = re.findall(r'<div class="pi-item pi-data pi-item-spacing pi-border-color".*?>(.*?)</div>\s*</div>', infobox, re.DOTALL)
            
            for item in items:
                label_match = re.search(r'<h3 class="pi-data-label pi-secondary-font">(.*?)</h3>', item)
                value_match = re.search(r'<div class="pi-data-value pi-font">(.*?)</div>', item, re.DOTALL)
                
                if label_match and value_match:
                    label = re.sub(r'<[^>]+>', '', label_match.group(1)).strip()
                    value_html = value_match.group(1)
                    # Remove sup tags (references)
                    value_html = re.sub(r'<sup.*?</sup>', '', value_html)
                    # Replace br with newline
                    value_html = re.sub(r'<br\s*/?>', '\n', value_html)
                    # Remove other tags
                    value = re.sub(r'<[^>]+>', '', value_html).strip()
                    # Clean up multiple spaces/newlines
                    value = re.sub(r'\n+', ' | ', value)
                    value = re.sub(r'\s+', ' ', value)
                    
                    char_data[label] = value
        
        results[char] = char_data
        print(f"Fetched {char}")
        time.sleep(0.5)
    except Exception as e:
        print(f"Error fetching {char}: {e}")

with open('op_chars_data.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Done!")
