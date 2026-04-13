import urllib.request
import json
import time
from html.parser import HTMLParser

class InfoboxParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_infobox = False
        self.in_label = False
        self.in_value = False
        self.in_sup = False
        self.current_label = ""
        self.current_value = ""
        self.data = {}
        self.div_depth = 0
        self.infobox_depth = -1

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get('class', '').split()
        
        if tag == 'aside' and 'portable-infobox' in classes:
            self.in_infobox = True
            self.infobox_depth = 0
            
        if self.in_infobox:
            if tag == 'aside':
                self.infobox_depth += 1
            elif tag == 'h3' and 'pi-data-label' in classes:
                self.in_label = True
                self.current_label = ""
            elif tag == 'div' and 'pi-data-value' in classes:
                self.in_value = True
                self.current_value = ""
            elif tag == 'sup':
                self.in_sup = True
            elif tag == 'br' and self.in_value:
                self.current_value += " | "

    def handle_endtag(self, tag):
        if self.in_infobox:
            if tag == 'aside':
                self.infobox_depth -= 1
                if self.infobox_depth == 0:
                    self.in_infobox = False
            elif tag == 'h3' and self.in_label:
                self.in_label = False
            elif tag == 'div' and self.in_value:
                self.in_value = False
                self.data[self.current_label.strip()] = self.current_value.strip()
            elif tag == 'sup':
                self.in_sup = False

    def handle_data(self, data):
        if self.in_label and not self.in_sup:
            self.current_label += data
        elif self.in_value and not self.in_sup:
            self.current_value += data

missing = {
    "Don Krieg": "Krieg",
    "Tama": "Kozuki_Tama",
    "Charlotte Brulee": "Charlotte_Brûlée",
    "Ryuma": "Shimotsuki_Ryuma",
    "Bell-mere": "Bell-mère",
    "Kuina": "Kuina",
    "Hyogoro": "Hyogoro",
    "York": "York",
    "T-Bone": "T-Bone"
}

results = {}

for char, page in missing.items():
    url = f"https://onepiece.fandom.com/api.php?action=parse&page={urllib.parse.quote(page)}&format=json&prop=text"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        if 'parse' not in data:
            print(f"Failed to parse {char}")
            continue
            
        html = data['parse']['text']['*']
        
        parser = InfoboxParser()
        parser.feed(html)
        
        results[char] = parser.data
        print(f"Fetched {char}")
        time.sleep(0.5)
    except Exception as e:
        print(f"Error fetching {char}: {e}")

with open('op_chars_missing.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Done!")
