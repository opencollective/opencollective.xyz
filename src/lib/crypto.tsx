import config from "@/config";
import { ChainConfig, EtherscanTransfer } from "@/types";

let cache: Record<string, EtherscanTransfer[]> = {};

setInterval(() => {
  cache = {};
}, 1000 * 60); // empty cache every minute

export async function getTransactions(
  chain: string,
  contractaddress: string | null,
  address: string | null
): Promise<EtherscanTransfer[]> {
  const chainConfig: ChainConfig =
    config.chains[chain as keyof typeof config.chains];
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
  const response = await fetch(apicall);
  const data = await response.json();
  if (data.status === "1") {
    cache[cacheKey] = data.result;
    return data.result;
  }
  throw new Error(
    `Failed to fetch transactions for ${chain}:${contractaddress}:${address}`
  );
}
