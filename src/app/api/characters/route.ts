import { createHash } from "node:crypto";
import charactersData from "@/data/characters.v2.json";

const charactersJson = JSON.stringify(charactersData);
const versionHash = createHash("sha256").update(charactersJson).digest("hex");

export async function GET() {
  return Response.json(
    {
      versionHash,
      characters: charactersData,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        ETag: `W/"${versionHash}"`,
      },
    }
  );
}
