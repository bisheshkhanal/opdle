/**
 * Staged roster publish dry-run workflow.
 *
 * Usage:
 *   npx tsx scripts/publish-roster.ts
 *   npx tsx scripts/publish-roster.ts --incoming scripts/scraped-characters.json --batch-size 50
 *
 * This script DOES NOT modify src/data/characters.v2.json.
 * It only reports:
 *  - staged additions (incoming ids not already in dataset)
 *  - schema validation gaps for staged additions
 *  - image convention + missing public/characters/{id}.png gaps
 *  - provenance completeness for staged additions
 */

import * as fs from "fs";
import * as path from "path";

import { getLocalCharacterImageUrl } from "@/lib/images";
import { type Character, validateCharacter } from "@/lib/types";

type RawCharacter = Omit<Character, "devilFruitType"> & {
  devilFruitType:
    | Character["devilFruitType"]
    | "Paramecia"
    | "Zoan"
    | "Logia"
    | "None";
};

interface StagedCandidate {
  raw: RawCharacter;
  normalized: Character;
}

interface CliOptions {
  incomingPath: string;
  datasetPath: string;
  imageDirPath: string;
  batchSize: number;
}

function parseCliOptions(): CliOptions {
  const projectRoot = process.cwd();
  const defaults: CliOptions = {
    incomingPath: path.join(projectRoot, "scripts", "new-characters.json"),
    datasetPath: path.join(projectRoot, "src", "data", "characters.v2.json"),
    imageDirPath: path.join(projectRoot, "public", "characters"),
    batchSize: 25,
  };

  const args = process.argv.slice(2);
  const options: CliOptions = { ...defaults };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--incoming" && typeof next === "string") {
      options.incomingPath = path.resolve(projectRoot, next);
      index += 1;
      continue;
    }

    if (arg === "--dataset" && typeof next === "string") {
      options.datasetPath = path.resolve(projectRoot, next);
      index += 1;
      continue;
    }

    if (arg === "--batch-size" && typeof next === "string") {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.batchSize = parsed;
      }
      index += 1;
    }
  }

  return options;
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function toCharacter(raw: RawCharacter): Character {
  const devilFruitType = Array.isArray(raw.devilFruitType)
    ? raw.devilFruitType
    : [raw.devilFruitType];

  return {
    ...raw,
    devilFruitType,
    imageUrl: getLocalCharacterImageUrl(raw.id),
  };
}

function chunk<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function missingImageIds(
  characters: Character[],
  imageDirPath: string
): Character[] {
  return characters.filter((character) => {
    const imagePath = path.join(imageDirPath, `${character.id}.png`);
    return !fs.existsSync(imagePath);
  });
}

function missingOrIncompleteProvenance(characters: Character[]): Character[] {
  return characters.filter((character) => {
    const provenance = character.provenance;
    if (!provenance) {
      return true;
    }

    return (
      provenance.source.trim().length === 0 ||
      provenance.scrapedAt.trim().length === 0 ||
      !Number.isInteger(provenance.version)
    );
  });
}

function main(): void {
  const options = parseCliOptions();

  const existing = readJsonFile<Character[]>(options.datasetPath);
  const incomingRaw = readJsonFile<RawCharacter[]>(options.incomingPath);

  const existingIds = new Set(existing.map((character) => character.id));
  const stagedIncoming: StagedCandidate[] = incomingRaw
    .map((raw) => ({ raw, normalized: toCharacter(raw) }))
    .filter((candidate) => !existingIds.has(candidate.normalized.id));

  const stagedCharacters = stagedIncoming.map(
    (candidate) => candidate.normalized
  );

  const batches = chunk(stagedIncoming, options.batchSize);

  const invalidStaged = stagedIncoming
    .filter((candidate) => !validateCharacter(candidate.normalized as unknown))
    .map((candidate) => candidate.normalized);
  const wrongIncomingImageConvention = stagedIncoming.filter(
    (candidate) =>
      candidate.raw.imageUrl !==
      getLocalCharacterImageUrl(candidate.normalized.id)
  );

  const datasetImageGaps = missingImageIds(existing, options.imageDirPath);
  const stagedImageGaps = missingImageIds(
    stagedCharacters,
    options.imageDirPath
  );
  const stagedProvenanceGaps = missingOrIncompleteProvenance(stagedCharacters);

  console.log("=== Roster Staged Publish Dry Run ===");
  console.log(`Dataset file: ${options.datasetPath}`);
  console.log(`Incoming file: ${options.incomingPath}`);
  console.log(`Image directory: ${options.imageDirPath}`);
  console.log("");

  console.log("Step 1) Stage candidates");
  console.log(`- Existing dataset count: ${existing.length}`);
  console.log(`- Incoming candidate count: ${incomingRaw.length}`);
  console.log(`- Planned staged additions: ${stagedCharacters.length}`);
  console.log(`- Batch size: ${options.batchSize}`);
  console.log(`- Planned batches: ${batches.length}`);
  if (batches.length > 0) {
    batches.forEach((batch, index) => {
      const start = index * options.batchSize + 1;
      const end = start + batch.length - 1;
      console.log(`  Batch ${index + 1}: ${start}-${end} (${batch.length})`);
    });
  }
  console.log("");

  console.log("Step 2) Schema + image convention checks for staged additions");
  console.log(
    `- Valid staged additions: ${stagedCharacters.length - invalidStaged.length}`
  );
  console.log(`- Invalid staged additions: ${invalidStaged.length}`);
  if (invalidStaged.length > 0) {
    console.log(
      "  Invalid IDs:",
      invalidStaged.map((character) => character.id).join(", ")
    );
  }
  console.log(
    `- Incoming entries with non-standard imageUrl (will normalize): ${wrongIncomingImageConvention.length}`
  );
  if (wrongIncomingImageConvention.length > 0) {
    console.log(
      "  Non-standard image IDs:",
      wrongIncomingImageConvention
        .map((candidate) => candidate.normalized.id)
        .join(", ")
    );
  }
  console.log("");

  console.log("Step 3) Image gap report");
  console.log(`- Missing dataset images: ${datasetImageGaps.length}`);
  if (datasetImageGaps.length > 0) {
    console.log(
      `  Missing dataset image IDs: ${datasetImageGaps
        .map((character) => character.id)
        .join(", ")}`
    );
  }
  console.log(`- Missing staged images: ${stagedImageGaps.length}`);
  if (stagedImageGaps.length > 0) {
    console.log(
      `  Missing staged image IDs: ${stagedImageGaps
        .map((character) => character.id)
        .join(", ")}`
    );
  }
  console.log("");

  console.log("Step 4) Provenance completeness report (staged additions)");
  console.log(
    `- Staged additions missing/incomplete provenance: ${stagedProvenanceGaps.length}`
  );
  if (stagedProvenanceGaps.length > 0) {
    console.log(
      `  Missing provenance IDs: ${stagedProvenanceGaps
        .map((character) => character.id)
        .join(", ")}`
    );
  }
  console.log("");

  console.log("Result: DRY RUN ONLY. No dataset changes were published.");

  if (
    invalidStaged.length > 0 ||
    wrongIncomingImageConvention.length > 0 ||
    stagedImageGaps.length > 0
  ) {
    process.exitCode = 1;
  }
}

main();
