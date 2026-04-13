import json

with open('op_chars_data.json', 'r') as f:
    data = json.load(f)

print(data['Kuro'])
