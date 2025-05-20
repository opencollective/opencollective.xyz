import { ChainConfig } from "@/types";
import chains from "@/data/chains.json";

type CachedObject = {
  data: unknown;
  timestamp: number;
  version: number;
};

const cache: Record<string, CachedObject> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain");
  const contractaddress = searchParams.get("contractaddress");
  const address = searchParams.get("address");
  const action = searchParams.get("action");
  if (!chain) {
    return Response.json({ error: "Missing chain parameter" }, { status: 400 });
  }

  if (!action) {
    return Response.json(
      { error: "Missing action parameter" },
      { status: 400 }
    );
  }

  const chainConfig: ChainConfig = chains[chain as keyof typeof chains];
  const apikey = process.env[`${chain?.toUpperCase()}_ETHERSCAN_API_KEY`];
  if (!apikey) {
    return Response.json(
      {
        error: `Please set the API key in the environment variables ${chain?.toUpperCase()}_ETHERSCAN_API_KEY`,
      },
      { status: 500 }
    );
  }
  if (!contractaddress && !address) {
    return Response.json(
      { error: "Missing contractaddress or address parameter" },
      { status: 400 }
    );
  }

  const key = `${chain}:${contractaddress}:${address}:${action}`;
  const cached = cache[key];
  if (
    cached &&
    cached.timestamp > Date.now() - 1000 * 60 * 60 &&
    cached.version === 1
  ) {
    console.log("/api/etherscan: cache hit", key);
    return Response.json(cached.data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  }

  const params = new URLSearchParams({
    module: "account",
    action,
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    apikey,
  });

  if (address) {
    params.set("address", address);
  }
  if (contractaddress && action === "tokentx") {
    params.set("contractaddress", contractaddress);
  }

  try {
    const apicall = `${chainConfig.explorer_api}/api?${params.toString()}`;
    console.log("/api/etherscan: apicall", apicall);
    const response = await fetch(apicall);
    const data = await response.json();
    if (data.status === "1") {
      console.log("/api/etherscan: writing cache", key);
      cache[key] = {
        data,
        timestamp: Date.now(),
        version: 1,
      };
    }
    return Response.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: `Failed to fetch transactions` },
      { status: 500 }
    );
  }
}
