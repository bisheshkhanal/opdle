/**
 * One Piece Wiki character scraper — MediaWiki API only (Cloudflare blocks HTML)
 * Outputs: scripts/scraped-characters.json
 * Usage: npx tsx scripts/scrape-characters.ts
 */

import * as fs from "fs";
import * as path from "path";

type Gender = "Male" | "Female" | "Unknown" | "Other";
type DevilFruitType = "Paramecia" | "Zoan" | "Logia" | "None";
type HakiType = "O" | "A" | "C";

interface ScrapedCharacter {
  id: string;
  name: string;
  aliases: string[];
  imageUrl: string;
  gender: Gender;
  affiliationPrimary: string;
  devilFruitType: DevilFruitType;
  haki: HakiType[];
  bounty: number | null;
  heightCm: number | null;
  origin: string;
  firstArc: string;
  minTier: "nakama";
  bountyHistory?: Array<{ amount: number; arc: string }>;
  devilFruitRevealedInArc?: string | null;
  hakiRevealedInArc?: Partial<Record<HakiType, string>>;
}

const API_BASE = "https://onepiece.fandom.com/api.php";
const USER_AGENT = "OnePiecedleScraper/1.0 (contact: onepiecedle@example.com)";
const RATE_LIMIT_MS = 1500;

const CHAPTER_ARC_MAP: Array<[number, number, string]> = [
  [1, 7, "Romance Dawn"],
  [8, 21, "Orange Town"],
  [22, 41, "Syrup Village"],
  [42, 68, "Baratie"],
  [69, 95, "Arlong Park"],
  [96, 100, "Loguetown"],
  [101, 105, "Reverse Mountain"],
  [106, 114, "Whisky Peak"],
  [115, 129, "Little Garden"],
  [130, 154, "Drum Island"],
  [155, 217, "Arabasta"],
  [218, 236, "Jaya"],
  [237, 302, "Skypiea"],
  [303, 321, "Long Ring Long Land"],
  [322, 374, "Water 7"],
  [375, 430, "Enies Lobby"],
  [431, 441, "Post-Enies Lobby"],
  [442, 489, "Thriller Bark"],
  [490, 513, "Sabaody Archipelago"],
  [514, 524, "Amazon Lily"],
  [525, 548, "Impel Down"],
  [549, 580, "Marineford"],
  [581, 597, "Post-War"],
  [598, 602, "Return to Sabaody"],
  [603, 653, "Fish-Man Island"],
  [654, 699, "Punk Hazard"],
  [700, 801, "Dressrosa"],
  [802, 824, "Zou"],
  [825, 902, "Whole Cake Island"],
  [903, 908, "Levely"],
  [909, 1057, "Wano Country"],
  [1058, Infinity, "Egghead"],
];

const HAKI_CATEGORIES: Record<string, HakiType> = {
  "Armament Haki Users": "A",
  "Observation Haki Users": "O",
  "Supreme King Haki Users": "C",
};

const LIST_PAGES = [
  "List of Canon Characters/Names A-E",
  "List of Canon Characters/Names F-K",
  "List of Canon Characters/Names L-R",
  "List of Canon Characters/Names S-Z",
];

const SKIP_PREFIXES = [
  "Chapter ",
  "Episode ",
  "One Piece",
  "SBS Volume",
  "SBS",
  "Vivre Card",
  "Film",
  "Strong World",
  "Grand Data",
  "List of",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function chapterToArc(chapter: number): string {
  for (const [start, end, arc] of CHAPTER_ARC_MAP) {
    if (chapter >= start && chapter <= end) return arc;
  }
  return "Egghead";
}

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['''`]/g, "")
    .replace(/\./g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type WikiPage = {
  missing?: string;
  revisions?: Array<{ "*": string }>;
  categories?: Array<{ title: string }>;
};

async function fetchApi(
  params: Record<string, string>,
  retries = 3
): Promise<Record<string, unknown>> {
  const url = new URL(API_BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) await sleep(attempt * 3000);
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      if (attempt < retries - 1) continue;
      throw new Error(`Non-JSON response (Cloudflare block): ${contentType}`);
    }
    return response.json() as Promise<Record<string, unknown>>;
  }
  throw new Error("Max retries exceeded");
}

interface PageData {
  wikitext: string;
  categories: string[];
}

async function fetchBatchPageData(
  titles: string[]
): Promise<Map<string, PageData>> {
  const data = await fetchApi({
    action: "query",
    prop: "revisions|categories",
    rvprop: "content",
    titles: titles.join("|"),
    format: "json",
    cllimit: "500",
    redirects: "1",
  });
  const query = data.query as {
    pages: Record<string, WikiPage & { title: string }>;
    redirects?: Array<{ from: string; to: string }>;
    normalized?: Array<{ from: string; to: string }>;
  };

  const byTitle = new Map<string, PageData>();
  for (const page of Object.values(query.pages)) {
    if (page.missing !== undefined) continue;
    byTitle.set(page.title.toLowerCase(), {
      wikitext: page.revisions?.[0]?.["*"] ?? "",
      categories: (page.categories ?? [])
        .map((c) => c.title.replace(/^Category:/, ""))
        .filter(Boolean),
    });
  }

  const aliasMap = new Map<string, string>();
  for (const r of [...(query.redirects ?? []), ...(query.normalized ?? [])]) {
    aliasMap.set(r.from.toLowerCase(), r.to.toLowerCase());
  }

  const result = new Map<string, PageData>();
  for (const title of titles) {
    const lower = title.toLowerCase();
    const data = byTitle.get(lower) ?? byTitle.get(aliasMap.get(lower) ?? "");
    if (data) result.set(title, data);
  }
  return result;
}

function stripWiki(text: string): string {
  if (!text) return "";
  return text
    .replace(/<s>[^<]*<\/s>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{Nihongo\|([^|{}]+)\|[^}]*\}\}/gi, "$1")
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\{\{|\}\}/g, "")
    .replace(/'''+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBounty(raw: string): number | null {
  if (!raw) return null;
  const parts = raw.split(/<br\s*\/?>/gi);
  const lastPart = parts[parts.length - 1];
  const cleaned = stripWiki(lastPart).replace(/,/g, "").replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function parseBountyHistory(raw: string): number[] {
  if (!raw) return [];
  const results: number[] = [];
  for (const part of raw.split(/<br\s*\/?>/gi)) {
    const cleaned = stripWiki(part).replace(/,/g, "").replace(/[^\d]/g, "");
    if (cleaned) {
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 0) results.push(num);
    }
  }
  return results;
}

function parseHeight(raw: string): number | null {
  if (!raw) return null;
  const s = stripWiki(raw).trim();
  const cmMatch = s.match(/(\d+(?:\.\d+)?)\s*cm/i);
  if (cmMatch) return Math.round(parseFloat(cmMatch[1]));
  const ftInMatch = s.match(/(\d+)\s*['''′]\s*(\d+(?:\.\d+)?)\s*["″]?/);
  if (ftInMatch) {
    return Math.round(
      (parseInt(ftInMatch[1], 10) * 12 + parseFloat(ftInMatch[2])) * 2.54
    );
  }
  const numMatch = s.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val > 50 && val < 1500) return Math.round(val);
  }
  return null;
}

function parseDevilFruitType(raw: string): DevilFruitType {
  const s = stripWiki(raw).toLowerCase();
  if (s.includes("paramecia")) return "Paramecia";
  if (s.includes("zoan")) return "Zoan";
  if (s.includes("logia")) return "Logia";
  return "None";
}

function parseAffiliation(raw: string): string {
  if (!raw) return "Unknown";
  const first = raw
    .split(/<br\s*\/?>/gi)[0]
    .split("\n")[0]
    .split(";")[0];
  return stripWiki(first).replace(/\s+/g, " ").trim() || "Unknown";
}

function parseAliases(raw: string): string[] {
  if (!raw) return [];
  const s = stripWiki(raw).trim();
  if (!s) return [];
  return s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

interface CharBoxFields {
  affiliation?: string;
  dftype?: string;
  bounty?: string;
  height?: string;
  origin?: string;
  epithet?: string;
}

function parseCharBox(wikitext: string): CharBoxFields {
  const fields: CharBoxFields = {};
  const m = wikitext.match(/\{\{[Cc]har\s*[Bb]ox([\s\S]*?)\n\}\}/);
  if (!m) return fields;
  for (const line of m[1].split(/\n\|/)) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim().toLowerCase();
    const val = line.slice(eqIdx + 1).trim();
    if (key === "affiliation") fields.affiliation = val;
    else if (key === "dftype") fields.dftype = val;
    else if (key === "bounty") fields.bounty = val;
    else if (key === "height") fields.height = val;
    else if (key === "origin") fields.origin = val;
    else if (key === "epithet") fields.epithet = val;
  }
  return fields;
}

interface ListEntry {
  name: string;
  chapter: number;
}

function parseListPage(wikitext: string): ListEntry[] {
  const entries: ListEntry[] = [];
  for (const row of wikitext.split("|-")) {
    const links = row.match(/\[\[([^\]]+)\]\]/g);
    if (!links || links.length < 2) continue;
    let charName: string | null = null;
    let chapter: number | null = null;
    for (const link of links) {
      const pageName = link.slice(2, -2).split("|")[0].trim();
      const chapterMatch = pageName.match(/^Chapter\s+(\d+)$/i);
      if (chapterMatch) {
        chapter = parseInt(chapterMatch[1], 10);
        continue;
      }
      if (
        pageName.length < 2 ||
        pageName.includes(":") ||
        /^\d+$/.test(pageName) ||
        SKIP_PREFIXES.some((p) => pageName.startsWith(p))
      ) {
        continue;
      }
      if (!charName) charName = pageName;
    }
    if (charName && chapter !== null) {
      entries.push({ name: charName, chapter });
    }
  }
  return entries;
}

function buildCharacter(
  name: string,
  firstArc: string,
  pageData: PageData
): ScrapedCharacter | null {
  const { wikitext, categories } = pageData;
  if (!wikitext || !/\{\{[Cc]har\s*[Bb]ox/i.test(wikitext)) return null;

  const charBox = parseCharBox(wikitext);

  const gender: Gender = categories.includes("Female Characters")
    ? "Female"
    : categories.includes("Male Characters")
      ? "Male"
      : "Unknown";

  const haki: HakiType[] = [];
  const hakiRevealedInArc: Partial<Record<HakiType, string>> = {};
  for (const cat of categories) {
    const h = HAKI_CATEGORIES[cat];
    if (h && !haki.includes(h)) {
      haki.push(h);
      hakiRevealedInArc[h] = firstArc;
    }
  }

  const dfType = parseDevilFruitType(charBox.dftype ?? "");
  const rawBounty = charBox.bounty ?? "";
  const bountyAmounts = parseBountyHistory(rawBounty);
  const latestBounty = parseBounty(rawBounty);
  const bountyHistory = bountyAmounts.map((amount) => ({
    amount,
    arc: firstArc,
  }));
  const heightCm = parseHeight(charBox.height ?? "");
  const origin = stripWiki(charBox.origin ?? "").trim() || "Unknown";
  const affiliationPrimary = parseAffiliation(charBox.affiliation ?? "");
  const aliases = parseAliases(charBox.epithet ?? "");
  const id = generateId(name);

  return {
    id,
    name,
    aliases,
    imageUrl: `/characters/${id}.png`,
    gender,
    affiliationPrimary,
    devilFruitType: dfType,
    haki,
    bounty: latestBounty,
    heightCm,
    origin,
    firstArc,
    minTier: "nakama",
    bountyHistory: bountyHistory,
    devilFruitRevealedInArc: dfType !== "None" ? firstArc : null,
    hakiRevealedInArc: hakiRevealedInArc,
  };
}

async function main() {
  console.log("=== One Piece Character Scraper ===\n");

  const existingPath = path.join(
    process.cwd(),
    "src",
    "data",
    "characters.v2.json"
  );
  const existingData = JSON.parse(
    fs.readFileSync(existingPath, "utf-8")
  ) as Array<{ name: string }>;
  const existingNames = new Set(
    existingData.map((c) => c.name.toLowerCase().trim())
  );
  console.log(`Loaded ${existingNames.size} existing characters to skip.\n`);

  console.log("Step 1: Parsing character list pages...");
  const allEntries: ListEntry[] = [];
  const seenNames = new Set<string>();

  for (const listPage of LIST_PAGES) {
    console.log(`  Fetching: ${listPage}`);
    const data = await fetchApi({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      titles: listPage,
      format: "json",
    });
    const query = data.query as { pages: Record<string, WikiPage> };
    const page = Object.values(query.pages)[0];
    const wikitext = page?.revisions?.[0]?.["*"] ?? "";
    const entries = parseListPage(wikitext);
    let added = 0;
    for (const e of entries) {
      const key = e.name.toLowerCase().trim();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        allEntries.push(e);
        added++;
      }
    }
    console.log(`  → ${entries.length} parsed, ${added} unique added`);
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nTotal unique entries: ${allEntries.length}`);

  const newEntries = allEntries.filter(
    (e) => !existingNames.has(e.name.toLowerCase().trim())
  );
  console.log(`After filtering existing: ${newEntries.length} to scrape\n`);

  console.log("Step 2: Scraping character pages (batch mode, 50/request)...");
  const results: ScrapedCharacter[] = [];
  let scraped = 0;
  let skipped = 0;
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(newEntries.length / BATCH_SIZE);

  for (let b = 0; b < newEntries.length; b += BATCH_SIZE) {
    const batch = newEntries.slice(b, b + BATCH_SIZE);
    const batchNum = Math.floor(b / BATCH_SIZE) + 1;
    process.stdout.write(
      `  Batch ${batchNum}/${totalBatches} (${batch.length} chars)... `
    );

    let batchMap: Map<string, PageData>;
    try {
      batchMap = await fetchBatchPageData(batch.map((e) => e.name));
    } catch (err) {
      console.log(`FAILED: ${(err as Error).message}`);
      skipped += batch.length;
      await sleep(RATE_LIMIT_MS * 3);
      continue;
    }

    let batchScraped = 0;
    for (const entry of batch) {
      const pageData = batchMap.get(entry.name);
      if (!pageData) {
        skipped++;
        continue;
      }
      const firstArc = chapterToArc(entry.chapter);
      const char = buildCharacter(entry.name, firstArc, pageData);
      if (char) {
        results.push(char);
        scraped++;
        batchScraped++;
      } else {
        skipped++;
      }
    }
    console.log(`✓ ${batchScraped} chars scraped (total: ${scraped})`);
    await sleep(RATE_LIMIT_MS);
  }

  const outputPath = path.join(
    process.cwd(),
    "scripts",
    "scraped-characters.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n=== Done ===`);
  console.log(`Scraped: ${results.length}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Output:  ${outputPath}`);

  if (results.length > 0) {
    console.log("\nFirst character sample:");
    console.log(JSON.stringify(results[0], null, 2));
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
