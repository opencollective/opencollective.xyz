import { getCollectiveConfig } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectiveSlug: string }> }
) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug as string);

  // Get query parameters
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || "Ticket";
  const ticketsTotal = parseInt(url.searchParams.get("ticketsTotal") || "1");
  const ticketsLeft = parseInt(url.searchParams.get("ticketsLeft") || "1");
  const expiryDate =
    url.searchParams.get("expiryDate") || new Date().toISOString();

  // Format expiry date
  const formattedExpiryDate = new Date(expiryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const primaryColor = collectiveConfig?.theme?.primaryColor || "#000000";
  const secondaryColor = collectiveConfig?.theme?.secondaryColor || "#000000";

  const image = collectiveConfig?.profile?.photo
    ? `
  <image
        xlink:href="${collectiveConfig?.profile?.photo}"
        x="0" y="148" width="212" height="188"
        preserveAspectRatio="xMidYMid slice"
        filter="url(#greyscale)"
      />
      <rect x="0" y="168" width="212" height="188" fill="${primaryColor}" opacity="0.4" style="mix-blend-mode: soft-light;" />
  `
    : `<rect x="0" y="148" width="212" height="188" fill="${secondaryColor}" opacity="0.4" style="mix-blend-mode: multiply;" />`;

  return new Response(
    `
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
      <text x="106" y="40" font-size="16" font-weight="bold" letter-spacing="-0.5">${collectiveConfig?.profile?.name}</text>
    </g>

    <image
      xlink:href="${collectiveConfig?.profile?.picture}"
      x="76" y="60"
      width="60" height="60"
      clip-path="circle(50% at 50% 50%)"
    />

    
    <rect x="0" y="148" width="212" height="30" fill="white" fill-opacity="0.8"/>
    <text x="106" y="169" font-size="16" font-weight="bold" fill="#000000" text-anchor="middle">
      ${name}
    </text>
    
    <g font-size="12" fill="#FFFFFF" font-weight="500" style="text-shadow: 0px 1px 3px rgba(0,0,0,0.5);">
      <text x="15" y="310" text-anchor="start">
        <tspan>Tickets</tspan>
        <tspan x="15" dy="1.4em" font-size="12" font-weight="bold">${ticketsLeft}/${ticketsTotal}</tspan>
      </text>
      <text x="197" y="310" text-anchor="end">
        <tspan>Expiry</tspan>
        <tspan x="197" dy="1.4em" font-size="12" font-weight="bold">${formattedExpiryDate}</tspan>
      </text>
    </g>
    <rect x="0" y="0" width="212" height="336" fill="url(#glossEffect)" />
  </g>
</svg>


    `,
    {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    }
  );
}
