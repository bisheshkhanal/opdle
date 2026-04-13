import { ImageResponse } from "next/og";

export const runtime = "edge";

function splitEmojiGrid(emojiGrid: string): string[] {
  return emojiGrid.split("\n").filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const template =
    url.searchParams.get("template") === "bounty" ? "bounty" : "dossier";
  const guessCount = url.searchParams.get("guessCount") ?? "0";
  const emojiGrid = url.searchParams.get("emojiGrid") ?? "";
  const title = url.searchParams.get("title") ?? "Onepiecedle";
  const imageUrl = url.searchParams.get("imageUrl");

  const isBounty = template === "bounty";
  const accent = isBounty ? "#b45309" : "#d4a017";
  const surface = isBounty ? "#2a1608" : "#071d33";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "56px",
        background:
          "linear-gradient(135deg, rgba(10,17,34,1) 0%, rgba(20,30,55,1) 55%, rgba(5,10,20,1) 100%)",
        color: "#f8fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          border: `2px solid ${accent}`,
          borderRadius: "32px",
          background: `linear-gradient(180deg, ${surface} 0%, rgba(15,23,42,0.88) 100%)`,
          padding: "40px",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                fontSize: 26,
                letterSpacing: "0.14em",
                color: accent,
                textTransform: "uppercase",
              }}
            >
              {isBounty ? "Bounty Report" : "Marine Intelligence Dossier"}
            </div>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.02 }}>
              {title}
            </div>
            <div style={{ fontSize: 28, color: "#cbd5e1" }}>
              Solved in {guessCount}/6 guesses
            </div>
          </div>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              width={230}
              height={230}
              style={{
                borderRadius: "28px",
                objectFit: "cover",
                border: `4px solid ${accent}`,
                background: "rgba(15, 23, 42, 0.9)",
              }}
            />
          ) : (
            <div
              style={{
                width: 230,
                height: 230,
                borderRadius: "28px",
                border: `4px dashed ${accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#cbd5e1",
              }}
            >
              No portrait
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            marginTop: "24px",
          }}
        >
          <div
            style={{ fontSize: 24, letterSpacing: "0.08em", color: "#94a3b8" }}
          >
            EMOJI GRID
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: 34,
              lineHeight: 1.1,
            }}
          >
            {splitEmojiGrid(emojiGrid).length > 0 ? (
              splitEmojiGrid(emojiGrid).map((row, index) => (
                <div key={`${row}-${index}`}>{row}</div>
              ))
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 28 }}>
                Awaiting result grid
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
