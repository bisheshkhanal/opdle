const fs = require("fs");

const characters = [
  "Kuro",
  "Don_Krieg",
  "Morgan",
  "Karoo",
  "Galdino",
  "Blueno",
  "Edward_Weevil",
  "Tama",
  "Trebol",
  "Diamante",
  "Pica",
  "Sugar",
  "Senor_Pink",
  "Charlotte_Brulee",
  "Shimotsuki_Ryuma",
  "Zeus",
  "Zeff",
  "Bell-mere",
  "Kuina",
  "Imu",
  "Hannyabal",
  "Makino",
  "Curly_Dadan",
  "Fisher_Tiger",
  "Viola",
  "Hyogoro",
  "York",
  "T-Bone",
  "Vander_Decken_IX",
  "Wanda",
  "Otohime",
];

async function fetchChar(char) {
  const url = `https://onepiece.fandom.com/api.php?action=parse&page=${char}&format=json&prop=text`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.parse) return null;

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
    return null;
  }
}

async function main() {
  const results = [];
  for (const char of characters) {
    const data = await fetchChar(char);
    if (data) results.push(data);
  }
  fs.writeFileSync("op_char_data.json", JSON.stringify(results, null, 2));
  console.log("Done");
}

main();
