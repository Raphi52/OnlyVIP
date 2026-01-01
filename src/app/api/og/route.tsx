import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const title = searchParams.get("title") || "VipOnly";
    const subtitle = searchParams.get("subtitle") || "Exclusive Creator Platform";
    const image = searchParams.get("image");
    const type = searchParams.get("type") || "default"; // default, creator, gallery

    // Generate different layouts based on type
    if (type === "creator" && image) {
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
                "radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
            }}
          >
            {/* Creator avatar with gold border */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)",
                padding: 6,
                marginBottom: 32,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                width={188}
                height={188}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Title */}
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#D4AF37",
                textAlign: "center",
              }}
            >
              {subtitle}
            </div>

            {/* VipOnly branding */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                bottom: 40,
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <span style={{ fontSize: 24, color: "#D4AF37", fontWeight: 700 }}>
                VipOnly
              </span>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Default OG image
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
            {title}
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
            {subtitle}
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
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
