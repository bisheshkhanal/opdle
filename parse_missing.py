import json
import re

with open('op_chars_missing.json', 'r') as f:
    data = json.load(f)

def extract_bounty(text):
    if not text: return None
    match = re.search(r'([\d,]+)', text)
    if match:
        return int(match.group(1).replace(',', ''))
    return None

def extract_height(text):
    if not text: return None
    match = re.search(r'(\d+)\s*cm', text)
    if match:
        return int(match.group(1))
    return None

for char, info in data.items():
    print(f"--- {char} ---")
    
    # Affiliation
    affiliations = info.get('Affiliations:', '')
    if not affiliations:
        affiliations = info.get('Affiliation:', '')
    print(f"Affiliation: {affiliations}")
    
    # Devil Fruit
    df = info.get('Devil Fruit:', '')
    if not df:
        df = info.get('English Name:', '')
    print(f"Devil Fruit: {df}")
    
    # Haki
    haki = info.get('Haki:', '')
    print(f"Haki: {haki}")
    
    # Bounty
    bounty = info.get('Bounty:', '')
    print(f"Bounty: {bounty} -> {extract_bounty(bounty)}")
    
    # Origin
    origin = info.get('Origin:', '')
    print(f"Origin: {origin}")
    
    # Status
    status = info.get('Status:', '')
    print(f"Status: {status}")
    
    # Height
    height = info.get('Height:', '')
    print(f"Height: {height} -> {extract_height(height)}")
    
    print()
