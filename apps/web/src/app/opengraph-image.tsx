import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Fluent — Speak English like you mean it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const THEMES = ["Interviews", "Office", "Negotiation", "Travel", "IELTS", "Pronunciation"];

/** Geist ships with the `geist` package, so no network fetch is needed; the default font is used if the file is unavailable. */
async function loadFont(file: string): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(
      path.join(process.cwd(), "node_modules", "geist", "dist", "fonts", "geist-sans", file),
    );
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [semibold, regular] = await Promise.all([
    loadFont("Geist-SemiBold.ttf"),
    loadFont("Geist-Regular.ttf"),
  ]);
  const fonts = [
    semibold
      ? { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const }
      : null,
    regular
      ? { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const }
      : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#000000",
        color: "#ededed",
        padding: "64px 72px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        backgroundImage: "radial-gradient(#2e2e2e 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "1.5px solid #333333",
            background: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              border: "2.5px solid #ededed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: 999, background: "#0070f3" }} />
          </div>
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>Fluent</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 0.98,
            maxWidth: 1000,
          }}
        >
          Speak English like you mean it.
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            backgroundImage: "linear-gradient(90deg, #0070f3 0%, #7928ca 50%, #ff0080 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Real-time voice coaching for Indian English speakers.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {THEMES.map((t) => (
          <div
            key={t}
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              border: "1.5px solid #333333",
              background: "#0a0a0a",
              color: "#a1a1a1",
              fontSize: 22,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>,
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
