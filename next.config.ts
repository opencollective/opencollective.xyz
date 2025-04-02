import type { NextConfig } from "next";
import type { Redirect } from "next/dist/lib/load-custom-routes";

type SubdomainConfig = {
  drive: string;
  zoom: string;
  join: string;
  dework: string;
  bounties: string;
  tasks: string;
  projects: string;
  calendar: string;
  discord: string;
};

type SubdomainsRedirections = {
  [key: string]: SubdomainConfig;
};

const subdomainsRedirections: SubdomainsRedirections = {
  "opencollective.xyz": {
    drive:
      "https://drive.google.com/drive/u/0/folders/1g14Qyf_DmvGuevk4Ks5NgfkWPN5V6H6O",
    zoom: "https://us02web.zoom.us/j/6025635806",
    join: "https://jz04xmgcexm.typeform.com/to/lPbcL9nj?typeform-source=join.allforclimate.earth",
    dework: "https://dework.xyz/o/all-for-clim-5YSFCGX71LR0qVyvqsL2w5",
    bounties: "https://dework.xyz/o/all-for-clim-5YSFCGX71LR0qVyvqsL2w5",
    tasks: "https://dework.xyz/o/all-for-clim-5YSFCGX71LR0qVyvqsL2w5",
    projects: "https://dework.xyz/o/all-for-clim-5YSFCGX71LR0qVyvqsL2w5",
    calendar:
      "https://calendar.google.com/calendar/u/0/embed?src=c_kcbdb0ulem2nivoiugvfbmhjb8@group.calendar.google.com",
    discord: "https://discord.gg/7Cb6Nf2MgM",
  },
};

const nextConfig: NextConfig = {
  env: {
    OC_GRAPHQL_API: "https://api.opencollective.com/graphql/v1/",
    OC_GRAPHQL_API_V2: "https://api.opencollective.com/graphql/v2/",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.airtable.com",
      },
      {
        protocol: "https",
        hostname: "**.twimg.com",
      },
    ],
  },
  async redirects() {
    const domains = Object.keys(subdomainsRedirections);
    const redirections: Redirect[] = [];
    domains.forEach((domain) => {
      // console.log("\nRedirections for", domain);
      const subdomains = Object.keys(subdomainsRedirections[domain]);
      subdomains.forEach((subdomain) => {
        // console.log(
        // `> ${subdomain}.${domain} -> ${subdomainsRedirections[domain][subdomain]}`
        // );
        redirections.push({
          source: "/(.*)",
          has: [
            {
              type: "host",
              value: `${subdomain}.${domain}`,
            },
          ],
          permanent: false,
          destination:
            subdomainsRedirections[domain][subdomain as keyof SubdomainConfig],
        });
      });
    });
    return redirections;
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
