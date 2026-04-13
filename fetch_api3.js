const characters = [
  "Krieg",
  "Kozuki_Tama",
  "Kuina",
  "Hyogoro",
  "York",
  "T-Bone",
];

async function fetchChar(char) {
  const url = `https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&titles=${encodeURIComponent(char)}&format=json`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const pages = json.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return { Name: char, Error: "Not found" };

    const content = pages[pageId].revisions[0]["*"];

    // Extract infobox
    const infoboxMatch = content.match(/{{Infobox Character[\s\S]*?\n}}/);

    return {
      Name: char,
      Infobox: infoboxMatch ? infoboxMatch[0] : "No infobox",
    };
  } catch (e) {
    return { Name: char, Error: e.message };
  }
}

async function main() {
  for (const char of characters) {
    const data = await fetchChar(char);
    console.log(`--- ${char} ---`);
    if (data.Infobox) {
      console.log(data.Infobox.substring(0, 500));
    } else {
      console.log(data);
    }
  }
}

main();
