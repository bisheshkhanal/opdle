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
  const url = `https://onepiece.fandom.com/wiki/${char}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.log(`Failed to fetch ${char}`);
      return null;
    }
    const html = await res.text();

    const data = { Name: char.replace(/_/g, " ") };

    // Very basic regex parsing for infobox data
    const regex =
      /<h3 class="pi-data-label[^>]*>([^<]+)<\/h3>\s*<div class="pi-data-value[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const label = match[1].trim();
      // Strip HTML tags and references
      let value = match[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\[\d+\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      data[label] = value;
    }

    console.log(`Fetched ${char}`);
    return data;
  } catch (e) {
    console.log(`Error on ${char}: ${e.message}`);
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
}

main();
