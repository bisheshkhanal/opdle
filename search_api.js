const characters = ["Tama", "Kuina", "Hyogoro", "York", "T-Bone"];

async function searchChar(char) {
  const url = `https://onepiece.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(char)}&format=json`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.query.search.slice(0, 3).map((s) => s.title);
  } catch (e) {
    return [];
  }
}

async function main() {
  for (const char of characters) {
    const titles = await searchChar(char);
    console.log(`--- ${char} ---`);
    console.log(titles);
  }
}

main();
