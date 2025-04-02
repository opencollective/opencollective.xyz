import { ChainConfig, EtherscanTransfer } from "@/types";
import chains from "@/chains.json";
let cache: Record<string, EtherscanTransfer[]> = {};

setInterval(() => {
  cache = {};
}, 1000 * 60); // empty cache every minute

export async function getTransactions(
  chain: string,
  contractaddress: string | null,
  address?: string | null
): Promise<EtherscanTransfer[]> {
  const chainConfig: ChainConfig = chains[chain as keyof typeof chains];
  const apikey = process.env[`${chain?.toUpperCase()}_ETHERSCAN_API_KEY`];

  if (!apikey) {
    console.error("No API key found for", chainConfig.explorer_api);
    console.error(
      "Please set the API key in the .env file",
      `${chain?.toUpperCase()}_ETHERSCAN_API_KEY`
    );
    throw new Error("API key not configured");
  }

  if (!chainConfig.explorer_api) {
    throw new Error(`No explorer API found for chain ${chain}`);
  }

  const cacheKey = `${chain}:${contractaddress}:${address}`;
  if (cache[cacheKey]) {
    console.log(">>> cache hit", cacheKey);
    return cache[cacheKey];
  }
  console.log(">>> getTransactions", chain, contractaddress, address);

  const params = new URLSearchParams({
    module: "account",
    action: "tokentx",
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    apikey: apikey || "",
  });

  // Add optional filters
  if (address) {
    params.set("address", address);
  }
  if (contractaddress) {
    params.set("contractaddress", contractaddress);
  }

  const apicall = `${chainConfig.explorer_api}/api?${params.toString()}`;
  console.log(">>> apicall", apicall);
  const response = await fetch(apicall);
  const data = await response.json();
  if (data.status === "1") {
    cache[cacheKey] = data.result;
    return data.result;
  }
  if (data.status === "0") {
    console.error(">>> error fetching transactions", data.message);
    return data.result;
  }
  console.error(">>> error fetching transactions", data);
  throw new Error(
    `Failed to fetch transactions for ${chain}:${contractaddress}:${address}`
  );
}
