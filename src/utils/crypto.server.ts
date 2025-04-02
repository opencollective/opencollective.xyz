import type { Address } from "@/types/index.d.ts";
import { JsonRpcProvider } from "ethers";
import chains from "@/chains.json";

export function truncateAddress(address: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ensNameCache = new Map<Address, string>();
export async function getENSNameFromAddress(address: Address) {
  if (ensNameCache.has(address)) {
    console.log(">>> ensNameCache hit", address, ensNameCache.get(address));
    return ensNameCache.get(address);
  }
  try {
    // const rpcIndex = Math.floor(Math.random() * chains["ethereum"].rpc.length);
    const provider = new JsonRpcProvider(chains["ethereum"].rpc[0]);
    const ensName = await provider.lookupAddress(address);
    if (ensName) {
      ensNameCache.set(address, ensName || "");
    }
    console.log(">>> ensNameCache miss", address, ensName);
    return ensName || undefined;
  } catch (error) {
    console.error(">>> error getting ENS name", error);
    return undefined;
  }
}
const ensAddressCache = new Map<string, Address>();
export async function getAddressFromENSName(ensName: string) {
  if (ensAddressCache.has(ensName)) {
    return ensAddressCache.get(ensName);
  }
  try {
    // const rpcIndex = Math.floor(Math.random() * chains["ethereum"].rpc.length);
    const provider = new JsonRpcProvider(chains["ethereum"].rpc[0]);
    const address = await provider.resolveName(ensName);
    if (address) {
      ensAddressCache.set(ensName, address as Address);
    }
    return address as Address;
  } catch (error) {
    console.error(">>> error getting address from ENS name", error);
    return undefined;
  }
}
