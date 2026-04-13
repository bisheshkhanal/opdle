const fs = require("fs");

const characters = [
  "Don_Krieg",
  "Tama",
  "Charlotte_Brûlée",
  "Bell-mère",
  "Kuina",
  "Hyogoro",
  "York",
  "T-Bone",
];

async function fetchChar(char) {
  const url = `https://onepiece.fandom.com/api.php?action=parse&page=${encodeURIComponent(char)}&format=json&prop=text`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.parse) return { Name: char, Error: "Not found" };

    const html = json.parse.text["*"];
    const data = { Name: char.replace(/_/g, " ") };

    const regex =
      /<h3 class="pi-data-label[^>]*>([^<]+)<\/h3>\s*<div class="pi-data-value[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const label = match[1].trim();
      let value = match[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\[\d+\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      data[label] = value;
    }
    return data;
  } catch (e) {
    return { Name: char, Error: e.message };
  }
}

async function main() {
  const results = [];
  for (const char of characters) {
    const data = await fetchChar(char);
    results.push(data);
  }
  console.log(JSON.stringify(results, null, 2));
}

main();
