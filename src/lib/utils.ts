import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import { ChainConfig, URI } from "@/types";
import { npubEncode } from "nostr-tools/nip19";
import chains from "@/chains.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (
  number: number,
  precision?: number,
  short = true
) => {
  let num = number,
    prec = precision || 2,
    suffix = "";
  const locale =
    typeof window !== "undefined" ? window.navigator.language : "en-US";

  if (short) {
    if (Math.abs(number) > 1000000000000) {
      num = number / 1000000000000;
      prec = 2;
      suffix = "T";
    } else if (Math.abs(number) > 1000000000) {
      num = number / 1000000000;
      prec = 2;
      suffix = "B";
    } else if (Math.abs(number) > 1000000) {
      num = number / 1000000;
      prec = 2;
      suffix = "M";
    } else if (Math.abs(number) > 1000) {
      num = number / 1000;
      prec = 2;
      suffix = "K";
    }
  }
  return (
    num.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: prec,
    }) + suffix
  );
};

export function formatTimestamp(ts: number, format = "MMM d HH:mm"): string {
  if (!ts) {
    console.error("formatTimestamp: ts is undefined");
    return "";
  }
  return formatInTimeZone(
    ts * 1000,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    format // "MMM d, yyyy 'at' HH:mm:ss zzz"
  );
}

export function generateURI(
  blockchain: string, // ethereum, bitcoin, solana, ...
  params: { chainId?: number; txHash?: string; address?: string }
): URI {
  const parts: (string | number)[] = [blockchain];
  if (params.chainId) {
    parts.push(params.chainId);
  }
  if (params.txHash) {
    parts.push("tx");
    parts.push(params.txHash);
  } else if (params.address) {
    parts.push("address");
    parts.push(params.address);
  } else {
    throw new Error("Invalid parameters");
  }
  return parts.join(":").toLowerCase() as URI;
}

export function getNpubFromPubkey(
  pubkey: string,
  options: { truncate?: boolean } = {}
) {
  const npub = npubEncode(pubkey);
  if (options.truncate) {
    return npub.slice(0, 6) + "..." + npub.slice(-4);
  }
  return npub;
}

export function isUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function getTxInfoUrlFromURI(uri?: string) {
  if (!uri) return null;
  const parts = uri.split(":");
  const chainId = parseInt(parts[1]);
  const addressType = parts[2];
  const value = parts[3];
  let res;
  Object.keys(chains).forEach((slug) => {
    const config = chains[slug as keyof typeof chains] as ChainConfig;
    if (config.id === chainId) {
      res = `/${slug}/${addressType}/${value}`;
      return;
    }
  });
  return res;
}

export function extractHashtags(text: string): {
  tags: string[];
  cleanDescription: string;
} {
  // Updated regex to match hashtags with simple values, key:attr format, and floating point numbers
  const hashtagRegex = /#(\w+(?::\w+(?:\.\d+)?)?)/g;
  const matches = text.match(hashtagRegex) || [];
  const tags = matches.map((tag) => tag.substring(1)); // Remove the # symbol

  // Remove hashtags from the description
  const cleanDescription = text
    .replace(hashtagRegex, "")
    .replace(/\s+/g, " ")
    .trim();

  return { tags, cleanDescription };
}

export function removeTagsFromContent(content: string): string {
  if (!content) return "";
  // Updated regex to match hashtags with simple values, key:attr format, and floating point numbers
  const hashtagRegex = /#(\w+(?::\w+(?:\.\d+)?)?)/g;

  // Remove hashtags from the description
  const cleanDescription = content
    .replace(hashtagRegex, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanDescription;
}

type URIObject = {
  blockchain: string;
  addressType: string;
  chainId?: number;
  txHash?: string;
  txid?: string;
  address?: string;
};

export function decomposeURI(uri: string): URIObject {
  if (uri.startsWith("ethereum")) {
    const [blockchain, chainId, addressType, value] = uri.split(":");
    const res: URIObject = {
      blockchain,
      chainId: parseInt(chainId),
      addressType,
    };
    if (addressType === "tx") {
      res.txHash = value;
    } else if (addressType === "address") {
      res.address = value;
    }
    return res;
  } else if (uri.startsWith("bitcoin")) {
    const [blockchain, addressType, value] = uri.split(":");
    const res: URIObject = {
      blockchain,
      addressType,
    };
    if (addressType === "tx") {
      res.txid = value;
    } else if (addressType === "address") {
      res.address = value;
    }
    return res;
  } else {
    throw new Error("Invalid URI");
  }
}
