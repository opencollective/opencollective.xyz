import { EtherscanTransfer } from "@/types";
import { cache } from "@/utils/cache";

if (!process.env.NEXT_PUBLIC_WEBAPP_URL) {
  throw new Error("NEXT_PUBLIC_WEBAPP_URL is not set");
}

export async function getTransactions(
  chain: string,
  contractaddress: string | null,
  address?: string | null,
  type: "token" | "native" = "token"
): Promise<EtherscanTransfer[]> {
  const parts = [chain, contractaddress, "address", address, type].filter(
    Boolean
  );
  const key = parts.join(":");

  const cachedObject = cache.get<EtherscanTransfer[]>(key, {
    ttl: 1000 * 60 * 60, // 1 hour
    gracePeriod: 1000 * 60 * 60 * 24, // 1 day
    refresh: () => getTransactions(chain, contractaddress, address, type),
  });
  console.log(
    ">>> getTransactions key",
    key,
    "cachedObject",
    cachedObject?.length
  );
  if (cachedObject) {
    return cachedObject;
  }

  console.log(">>> getTransactions", chain, contractaddress, address, type);

  const params = new URLSearchParams({
    chain,
    module: "account",
    action: type === "token" ? "tokentx" : "txlist",
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
  });

  // Add optional filters
  if (address) {
    params.set("address", address);
  }
  if (contractaddress && type === "token") {
    params.set("contractaddress", contractaddress);
  }

  const apicall = `${
    process.env.NEXT_PUBLIC_WEBAPP_URL
  }/api/etherscan?${params.toString()}`;
  console.log(">>> apicall", apicall);
  const response = await fetch(apicall);
  const data = await response.json();

  if (data.status === "1") {
    cache.set(key, data.result, { version: 1 });
    return data.result;
  } else {
    console.log(">>> getTransactions: no data", key, data);
    return [];
  }
}
