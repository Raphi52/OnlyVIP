import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VIPOnly - Exclusive Creator Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)",
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            display: "flex",
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            boxShadow: "0 0 60px rgba(212, 175, 55, 0.4)",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 24 24" fill="black">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
          }}
        >
          VIPOnly
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#888888",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Exclusive Creator Platform
        </div>

        {/* Decorative line */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
