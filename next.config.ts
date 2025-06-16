import type { NextConfig } from "next";
import type { Redirect } from "next/dist/lib/load-custom-routes";

type SubdomainConfig = {
  drive?: string;
  discord?: string;
  telegram?: string;
  gitcoin?: string;
};

type SubdomainsRedirections = {
  [key: string]: SubdomainConfig;
};

const subdomainsRedirections: SubdomainsRedirections = {
  "opencollective.xyz": {
    drive:
      "https://drive.google.com/drive/u/0/folders/1ShlkSnQvExg81ph7Z-oJAFAP9fl8U2ib",
    telegram: "https://t.me/opencollective",
    discord: "https://discord.gg/Fepd7VSe9D",
    gitcoin: "https://explorer.gitcoin.co/#/round/42161/867/44",
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
      {
        protocol: "https",
        hostname: "euc.li",
      },
      {
        protocol: "https",
        hostname: "**.discord.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
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
        const destination =
          subdomainsRedirections[domain][subdomain as keyof SubdomainConfig];
        if (!destination) {
          return;
        }
        redirections.push({
          source: "/(.*)",
          has: [
            {
              type: "host",
              value: `${subdomain}.${domain}`,
            },
          ],
          permanent: false,
          destination,
        });
      });
    });
    return redirections;
  },
};

export default nextConfig;
