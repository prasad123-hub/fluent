"use client";
import { GeistSans } from "geist/font/sans";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable}`}>
      <body
        style={{
          margin: 0,
          background: "#000",
          color: "#ededed",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>500</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#a1a1a1", maxWidth: 380, margin: 0 }}>
            The app hit an unexpected error while rendering. Try again; if it keeps happening, check
            the server logs.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>
              ref {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: 0,
              background: "#ededed",
              color: "#000",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
