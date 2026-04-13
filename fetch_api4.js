const characters = ["Krieg", "Tama", "Kuina", "Hyogoro", "York", "T-Bone"];

async function fetchChar(char) {
  const url = `https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&titles=${encodeURIComponent(char)}&format=json`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const pages = json.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return { Name: char, Error: "Not found" };

    const content = pages[pageId].revisions[0]["*"];

    // Find lines with height, bounty, origin
    const lines = content
      .split("\n")
      .filter(
        (l) =>
          l.toLowerCase().includes("height") ||
          l.toLowerCase().includes("bounty") ||
          l.toLowerCase().includes("origin") ||
          l.toLowerCase().includes("residence") ||
          l.toLowerCase().includes("affiliation")
      );

    return { Name: char, Lines: lines.slice(0, 10) };
  } catch (e) {
    return { Name: char, Error: e.message };
  }
}

async function main() {
  for (const char of characters) {
    const data = await fetchChar(char);
    console.log(`--- ${char} ---`);
    console.log(data.Lines);
  }
}

main();
