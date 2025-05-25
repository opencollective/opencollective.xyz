import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const seed = searchParams.get("seed");
  const width = searchParams.get("width") || "256";
  const height = searchParams.get("height") || "256";

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  const sharp = (await import("sharp")).default;

  try {
    // Fetch the original image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();

    const jpegBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(parseInt(width), parseInt(height), {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return new NextResponse(jpegBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error processing image:", imageUrl, error);

    // Return a fallback avatar if image processing fails
    const fallbackUrl = `${
      process.env.NEXT_PUBLIC_WEBAPP_URL
    }/api/avatar.png?seed=${encodeURIComponent(seed || imageUrl)}`;

    try {
      const fallbackResponse = await fetch(fallbackUrl);
      const arrayBuffer = await fallbackResponse.arrayBuffer();

      const jpegBuffer = await sharp(Buffer.from(arrayBuffer))
        .resize(parseInt(width), parseInt(height), {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      return new NextResponse(jpegBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
      });
    } catch (fallbackError) {
      console.error(
        "Error processing fallback image:",
        fallbackUrl,
        fallbackError
      );
      return new NextResponse("Failed to process image", { status: 500 });
    }
  }
}
