import type { Address } from "@/types/index.d.ts";
import { ethers, JsonRpcProvider } from "ethers";
import chains from "@/data/chains.json";

export function truncateAddress(address: Address) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ensNameCache = new Map<Address, string>();
const pendingRequests = new Map<Address, Promise<string | undefined>>();

export async function getENSNameFromAddress(address: Address) {
  if (!ethers.isAddress(address)) {
    console.error(">>> getENSNameFromAddress invalid address", address);
    return undefined;
  }

  if (ensNameCache.has(address)) {
    return ensNameCache.get(address);
  }

  // If there's already a pending request for this address, return that promise
  if (pendingRequests.has(address)) {
    return pendingRequests.get(address);
  }

  // Create a new promise for this request
  const promise = (async () => {
    try {
      const provider = new JsonRpcProvider(chains["ethereum"].rpc[1]);
      const ensName = await provider.lookupAddress(address);
      if (ensName) {
        ensNameCache.set(address, ensName);
      }
      return ensName || undefined;
    } catch (error) {
      console.error(">>> getENSNameFromAddress error getting ENS name", error);
      return undefined;
    } finally {
      // Clean up the pending request after it's done
      pendingRequests.delete(address);
    }
  })();

  // Store the promise in pendingRequests
  pendingRequests.set(address, promise);
  return promise;
}

const ensAddressCache = new Map<string, Address>();
export async function getAddressFromENSName(ensName: string) {
  if (!ensName || !ensName.endsWith(".eth")) {
    console.error(">>> getAddressFromENSName invalid ENS name", ensName);
    return undefined;
  }

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

interface ENSDetails {
  address: Address;
  name?: string;
  description?: string;
  avatar?: string;
  url?: string;
}

const ensDetailsCache = new Map<Address, ENSDetails>();
const pendingDetailsRequests = new Map<Address, Promise<ENSDetails>>();

export async function getENSDetailsFromAddress(
  address: Address
): Promise<ENSDetails> {
  if (!ethers.isAddress(address)) {
    console.error(">>> getENSDetailsFromAddress invalid address", address);
    return { address };
  }

  if (ensDetailsCache.has(address)) {
    return ensDetailsCache.get(address)!;
  }

  if (pendingDetailsRequests.has(address)) {
    return pendingDetailsRequests.get(address)!;
  }

  const promise = (async () => {
    try {
      const provider = new JsonRpcProvider(chains["ethereum"].rpc[1]);
      const details: ENSDetails = { address };

      const ensName = await provider.lookupAddress(address);
      if (ensName) {
        details.name = ensName;
        try {
          const resolver = await provider.getResolver(ensName);
          if (resolver) {
            // Define all the records we want to fetch (max 3 per batch when using free RPC)
            const recordNames = ["avatar", "url"];

            // Fetch all records in parallel
            const records = await Promise.all(
              recordNames.map((record) => resolver.getText(record))
            );

            if (records[0]) {
              details.avatar = records[0];
            }

            if (records[1]) {
              details.url = records[1];
            }
          }
        } catch (e) {
          console.error(
            ">>> getENSDetailsFromAddress error getting ENS details for address",
            address,
            e
          );
        }
      }

      ensDetailsCache.set(address, details);
      return details;
    } catch (error) {
      console.error(
        ">>> getENSDetailsFromAddress error resolving ENS address",
        address,
        error
      );
      return { address };
    } finally {
      pendingDetailsRequests.delete(address);
    }
  })();

  pendingDetailsRequests.set(address, promise);
  return promise;
}
