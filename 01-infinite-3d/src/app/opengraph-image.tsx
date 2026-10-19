import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Metadata image convention (Next 16): statically generated at build, no WebGL.
// ImageResponse ships Geist as its default font, so no font file is loaded here.
export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** same strokes as hud/Monogram.tsx MONOGRAM_D (kept inline: this route renders outside the app shell) */
const MONOGRAM_D = "M7 3H3V21H7M10.5 20V4L19.5 20V4M23.5 20L28 4L32.5 20M25.1 14.5H30.9M37 3H41V21H37";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0a0b10",
          backgroundImage: "radial-gradient(circle at 88% 8%, rgba(138,163,255,0.18), rgba(10,11,16,0) 45%)",
          color: "#e8e9f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg width="132" height="72" viewBox="0 0 44 24" fill="none">
            <path d={MONOGRAM_D} stroke="#6cf2ff" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.12em", color: "#9096ad" }}>
            {`// ${site.location.lat} ${site.location.lng}`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.12em", color: "#9096ad", textTransform: "uppercase" }}>
            {`// ${site.role}`}
          </div>
          <div style={{ display: "flex", fontSize: 132, lineHeight: 0.95, letterSpacing: "-0.04em", marginTop: 20 }}>{site.name}</div>
          <div style={{ display: "flex", width: 220, height: 2, marginTop: 40, background: "#6cf2ff", boxShadow: "0 0 18px #6cf2ff" }} />
          <div style={{ display: "flex", fontSize: 28, marginTop: 28, color: "#c9cbd8", maxWidth: 900 }}>{site.manifesto}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
