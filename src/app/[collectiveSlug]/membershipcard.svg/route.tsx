import { getCollectiveConfig } from "@/lib/config";
import sharp from "sharp";

export const runtime = "nodejs";

async function getBase64FromImageUrl(
  imgSrc: string | null | undefined,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ base64?: string; mimeType: string; svg?: string } | null> {
  if (!imgSrc) {
    return null;
  }
  try {
    const response = await fetch(imgSrc);
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Handle SVG images differently
    if (contentType.includes("svg")) {
      const svgContent = await response.text();
      return { svg: svgContent, mimeType: "image/svg+xml" };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
    console.log(
      ">>> getBase64FromImageUrl: loading image",
      imgSrc,
      "image size",
      buffer.length
    );
    // Process image with Sharp if dimensions are provided
    let processedBuffer: Buffer = buffer;
    if (maxWidth || maxHeight) {
      const metadata = await sharp(buffer).metadata();
      const { width, height } = metadata;

      if (width && height) {
        // Calculate the scaling factor needed to cover the area
        const widthRatio = maxWidth ? maxWidth / width : Infinity;
        const heightRatio = maxHeight ? maxHeight / height : Infinity;
        const scale = Math.max(widthRatio, heightRatio);

        // Calculate new dimensions
        const newWidth = Math.ceil(width * scale);
        const newHeight = Math.ceil(height * scale);

        processedBuffer = await sharp(buffer)
          .resize(newWidth, newHeight, { fit: "cover" })
          .toBuffer();
      }
    }

    const base64 = processedBuffer.toString("base64");
    return { base64, mimeType: contentType };
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

const formatDate = (date: number) => {
  return new Date(Number(date) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectiveSlug: string }> }
) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug as string);

  // Get query parameters
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || "Ticket";
  const mintedAt = parseInt(url.searchParams.get("mintedAt") || "1");
  const expiryDate = parseInt(url.searchParams.get("expiryDate") || "1");

  const primaryColor = collectiveConfig?.theme?.primaryColor || "#000000";
  const secondaryColor = collectiveConfig?.theme?.secondaryColor || "#000000";

  let image = `<rect x="0" y="148" width="212" height="188" fill="${secondaryColor}" opacity="0.4" style="mix-blend-mode: multiply;" />`;
  const photo =
    collectiveConfig?.profile?.photo || collectiveConfig?.profile?.banner;
  if (photo) {
    const imageData = await getBase64FromImageUrl(photo, 424, 396);
    if (imageData) {
      image = `<image
        xlink:href="data:${imageData.mimeType};base64,${imageData.base64}"
        x="0" y="148" width="212" height="188"
        preserveAspectRatio="xMidYMid slice"
        filter="url(#greyscale)"
      />
      <rect x="0" y="168" width="212" height="188" fill="${primaryColor}" opacity="0.4" style="mix-blend-mode: soft-light;" />
  `;
    }
  }

  const base64Logo = await getBase64FromImageUrl(
    collectiveConfig?.profile?.picture,
    120,
    120
  );

  const svgContent = `
    <svg width="424" height="672" viewBox="0 0 212 336" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border-radius: 16px; overflow: hidden;">

  <defs>
    <filter id="greyscale">
      <feColorMatrix type="saturate" values="0" />
    </filter>

  <linearGradient id="glossEffect" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop stop-color="white" stop-opacity="0">
        <animate attributeName="offset" dur="11.5s" repeatCount="indefinite" keyTimes="0; 0.13; 1" values="-0.3; 1; 1" />
      </stop>
      <stop stop-color="white" stop-opacity="0.2">
        <animate attributeName="offset" dur="11.5s" repeatCount="indefinite" keyTimes="0; 0.13; 1" values="-0.2; 1.1; 1.1" />
      </stop>
      <stop stop-color="white" stop-opacity="0">
        <animate attributeName="offset" dur="11.5s" repeatCount="indefinite" keyTimes="0; 0.13; 1" values="-0.1; 1.2; 1.2" />
      </stop>
    </linearGradient>

  </defs>

  <g style="border-radius: 16px; overflow: hidden;">
    <g>
      <rect width="212" height="336" fill="#f0f0f0"/>
      ${image}
    </g>

    <rect width="212" height="148" fill="${primaryColor}" />

    <g fill="#FFFFFF" text-anchor="middle">
      <text x="106" y="40" font-size="16" font-weight="bold" letter-spacing="-0.5">${
        collectiveConfig?.profile?.name
      }</text>
    </g>

     ${
       base64Logo
         ? base64Logo.mimeType.includes("svg")
           ? `<g transform="translate(76, 60)" clip-path="circle(50% at 50% 50%)">
${base64Logo.svg?.replace(
  /<svg(.*)width="\d+".*height="\d+"(.*)>/,
  '<svg$1width="60" height="60"$2>'
)}
         
       </g>`
           : `<image
              xlink:href="data:${base64Logo.mimeType};base64,${base64Logo.base64}"
              x="76" y="60"
              width="60" height="60"
              clip-path="circle(50% at 50% 50%)"
            />`
         : ""
     }

    
    <rect x="0" y="148" width="212" height="30" fill="white" fill-opacity="0.8"/>
    <text x="106" y="169" font-size="16" font-weight="bold" fill="#000000" text-anchor="middle">
      ${name}
    </text>
    
    <g font-size="12" fill="#FFFFFF" font-weight="500" style="text-shadow: 0px 1px 3px rgba(0,0,0,0.5);">
      <text x="15" y="310" text-anchor="start">
        <tspan>Member since</tspan>
        <tspan x="15" dy="1.4em" font-size="12" font-weight="bold">${formatDate(
          mintedAt
        )}</tspan>
      </text>
      <text x="197" y="310" text-anchor="end">
        <tspan>Expiry</tspan>
        <tspan x="197" dy="1.4em" font-size="12" font-weight="bold">${formatDate(
          expiryDate
        )}</tspan>
      </text>
    </g>
    <rect x="0" y="0" width="212" height="336" fill="url(#glossEffect)" />
  </g>
</svg>
  `;

  return new Response(svgContent, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Length": Buffer.byteLength(svgContent).toString(),
    },
  });
}
