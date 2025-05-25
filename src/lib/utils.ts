import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import {
  Address,
  ChainConfig,
  FiatCurrencySymbol,
  ProfileData,
  Token,
  TokenStats,
  Transaction,
  TransactionDirection,
  TxStats,
  URI,
  WalletConfig,
} from "@/types";
import { NostrNote } from "@/providers/NostrProvider";
import { npubEncode } from "nostr-tools/nip19";
import { ethers } from "ethers";
import chains from "@/data/chains.json";
import tokens from "@/data/tokens.json";

import ethUsdFxrate from "@/data/fxrate/eth.usd.fxrate.json";
import gtcUsdFxrate from "@/data/fxrate/gtc.usd.fxrate.json";
import glmUsdFxrate from "@/data/fxrate/glm.usd.fxrate.json";
import arbUsdFxrate from "@/data/fxrate/arb.usd.fxrate.json";
import celoUsdFxrate from "@/data/fxrate/celo.usd.fxrate.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCurrencySymbol = (currency: FiatCurrencySymbol) => {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    case "CHF":
      return "CHF";
    case "CAD":
      return "CA$";
    case "AUD":
      return "A$";
  }
};

export const formatAmount = (
  amount: number,
  options: { precision?: number } = {}
) => {
  const locale =
    typeof window !== "undefined" ? window.navigator.language : "en-US";
  return amount.toLocaleString(locale, {
    minimumFractionDigits: isNaN(options.precision || 2)
      ? 2
      : options.precision || 2,
    maximumFractionDigits: isNaN(options.precision || 2)
      ? 2
      : options.precision || 2,
  });
};

export const formatNumber = (
  number: number,
  precision?: number,
  short = true
) => {
  if (!number) return "0";
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

  if (num < 0.01) {
    prec = 4;
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

type TokenType = "token" | "fiat";

export type LeaderboardEntry = {
  uri: URI;
  stats: TxStats;
  transactions: Transaction[];
};
export type Leaderboard = LeaderboardEntry[];

export const getFxRate = (
  fromToken: Token,
  toCurrency: FiatCurrencySymbol,
  date: Date
) => {
  const ts = date.toISOString().split("T")[0].replace(/-/g, "");
  let fxRate = 1;
  if (fromToken.symbol === "ETH" && toCurrency === "USD") {
    fxRate = ethUsdFxrate[ts as keyof typeof ethUsdFxrate];
    if (!fxRate) {
      console.log(">>> No fx rate for ETH:USD on", ts);
      return 0;
    }
  }
  if (fromToken.symbol === "GTC" && toCurrency === "USD") {
    fxRate = gtcUsdFxrate[ts as keyof typeof gtcUsdFxrate];
    if (!fxRate) {
      console.log(">>> No fx rate for GTC:USD on", ts);
      return 0;
    }
  }
  if (fromToken.symbol === "GLM" && toCurrency === "USD") {
    fxRate = glmUsdFxrate[ts as keyof typeof glmUsdFxrate];
    if (!fxRate) {
      console.log(">>> No fx rate for GLM:USD on", ts);
      return 0;
    }
  }
  if (fromToken.symbol === "ARB" && toCurrency === "USD") {
    fxRate = arbUsdFxrate[ts as keyof typeof arbUsdFxrate];
    if (!fxRate) {
      console.log(">>> No fx rate for ARB:USD on", ts);
      return 0;
    }
  }
  if (fromToken.symbol === "CELO" && toCurrency === "USD") {
    fxRate = celoUsdFxrate[ts as keyof typeof celoUsdFxrate];
    if (!fxRate) {
      console.log(">>> No fx rate for CELO:USD on", ts);
      return 0;
    }
  }
  return fxRate;
};

export const getPrimaryToken = (
  chainId: number,
  primaryCurrency: FiatCurrencySymbol
) => {
  const chain = getChainSlugFromChainId(chainId);
  if (!chain) return null;
  const chainTokens = tokens[chain as keyof typeof tokens];
  const keys = Object.keys(chainTokens);
  for (const contractAddress of keys) {
    const token = chainTokens[
      contractAddress as keyof typeof chainTokens
    ] as Token;
    if (!token) continue;
    token.address = contractAddress as Address;
    token.chain = chain;
    if (primaryCurrency === "USD") {
      if (token.symbol === "USDC") {
        return token;
      }
    }
    if (primaryCurrency === "EUR") {
      if (token.symbol === "EURE") {
        return token;
      }
    }
  }
  return null;
};

const normalizeAmount = (
  fromToken: Token | null,
  toCurrency: FiatCurrencySymbol,
  amount: number,
  date: Date
) => {
  if (!fromToken || !toCurrency) return 0;
  if (
    fromToken.symbol?.startsWith(toCurrency) ||
    fromToken.symbol?.endsWith(toCurrency)
  ) {
    return amount;
  }
  const fxRate = getFxRate(fromToken, toCurrency, date);
  return amount * fxRate;
};

const getTokenType = (tokenSymbol: string): TokenType => {
  if (["CHT"].includes(tokenSymbol)) return "token";
  else return "fiat";
};

export function getLeaderboard(
  transactions: Transaction[],
  primaryCurrency: FiatCurrencySymbol,
  direction?: TransactionDirection
): Leaderboard {
  const result: Leaderboard = [];
  const entriesByUri = new Map<string, LeaderboardEntry>();

  const processTransaction = (
    tx: Transaction,
    direction: TransactionDirection
  ) => {
    if (tx.value === "0") {
      return;
    }

    const uri = generateURI("ethereum", {
      chainId: tx.chainId,
      address: direction === "inbound" ? tx.to : tx.from,
    });

    const amount = normalizeAmount(
      tx.token,
      primaryCurrency,
      Number(ethers.formatUnits(tx.value, tx.token.decimals)),
      new Date(tx.timestamp * 1000)
    );

    if (!entriesByUri.has(uri)) {
      entriesByUri.set(uri, {
        uri,
        stats: {
          inbound: {
            count: 0,
            value: 0,
          },
          outbound: {
            count: 0,
            value: 0,
          },
          internal: {
            count: 0,
            value: 0,
          },
          all: {
            count: 0,
            value: 0,
            net: 0,
          },
        },
        transactions: [],
      });
    }

    const entry = entriesByUri.get(uri)!;
    entry.stats.all.count += 1;
    entry.stats[direction].count += 1;
    entry.stats[direction].value += amount;
    entry.stats["all"].value += amount;
    entry.transactions.push(tx);
  };

  transactions.forEach((tx) => {
    if (direction === "outbound") {
      processTransaction(tx, "inbound");
    } else if (direction === "inbound") {
      processTransaction(tx, "outbound");
    } else {
      processTransaction(tx, "inbound");
      processTransaction(tx, "outbound");
    }
  });

  entriesByUri.forEach((entry) => {
    result.push(entry);
  });

  // Convert map to array and sort by txVolume descending
  const res = result.sort(
    (a, b) =>
      b.stats.inbound.value +
      b.stats.outbound.value -
      (a.stats.inbound.value + a.stats.outbound.value)
  );

  return res;
}

export const generateAvatar = (address: string) => {
  return `/api/avatar?seed=${address}`;
};

export const getAddressFromURI = (uri: string): Address => {
  return uri.substring(uri.lastIndexOf(":") + 1) as Address;
};

export const getChainIdFromURI = (uri: string): number | undefined => {
  if (uri && uri.startsWith("ethereum")) {
    return parseInt(uri.split(":")[1]);
  }
  return undefined;
};

export const getChainSlugFromChainId = (
  chainId?: number
): string | undefined => {
  if (!chainId) return undefined;
  return Object.keys(chains).find(
    (key) => chains[key as keyof typeof chains].id === chainId
  );
};

export const getChainIdFromChainSlug = (
  chainSlug?: string
): number | undefined => {
  if (!chainSlug) return undefined;
  return chains[chainSlug as keyof typeof chains].id;
};

export const getProfileFromNote = (
  note: NostrNote
): ProfileData | undefined => {
  if (note && note.tags?.length > 0) {
    const uri = note.tags.find((t) => t[0] === "i")?.[1];
    if (!uri) return undefined;
    const address = getAddressFromURI(uri);
    return {
      uri: uri as URI,
      address,
      name: note.content || "",
      about: note.tags.find((t) => t[0] === "about")?.[1] || "",
      picture: note.tags.find((t) => t[0] === "picture")?.[1] || "",
      website: note.tags.find((t) => t[0] === "website")?.[1] || "",
    };
  }
};

export function filterTransactions(
  transactions: Transaction[],
  tokenType: TokenType,
  direction: TransactionDirection,
  walletAddresses: Address[] | undefined
) {
  if (!walletAddresses || walletAddresses.length === 0) return transactions;

  const txs = transactions.filter((tx) => {
    if (!tx.token.symbol) return false;
    if (getTokenType(tx.token.symbol) !== tokenType) return false;

    if (direction === "inbound") {
      return (
        walletAddresses.includes(tx.to.toLowerCase() as Address) &&
        !walletAddresses.includes(tx.from.toLowerCase() as Address)
      );
    }
    if (direction === "outbound") {
      return (
        walletAddresses.includes(tx.from.toLowerCase() as Address) &&
        !walletAddresses.includes(tx.to.toLowerCase() as Address)
      );
    }
    if (direction === "internal") {
      return (
        walletAddresses.includes(tx.to.toLowerCase() as Address) ||
        walletAddresses.includes(tx.from.toLowerCase() as Address)
      );
    }
    return false;
  });
  return txs;
}

/**
 * Get totals by token type
 * @param transactions - Transactions to process
 * @param wallets - Wallets to process
 * @returns Totals by token type, eg. { "fiat": { inbound: number, outbound: number }, "token": { inbound: number, outbound: number } }
 */
export function getTotalsByTokenType(
  transactions: Transaction[],
  wallets: WalletConfig[],
  primaryCurrency: FiatCurrencySymbol
): Record<
  string,
  { inbound: number; outbound: number; internal: number }
> | null {
  if (!wallets || wallets.length === 0) return null;
  const walletAddresses = wallets
    .filter((w) => !!w.address)
    .map((w) => w.address.toLowerCase() as Address);

  return transactions.reduce((acc, tx) => {
    const tokenType = getTokenType(tx.token.symbol || "");
    const transactionDirection = getTransactionDirection(tx, walletAddresses);
    if (!transactionDirection || transactionDirection === "all") return acc;
    if (!acc[tokenType]) {
      acc[tokenType] = {
        inbound: 0,
        outbound: 0,
        internal: 0,
      };
    }
    const amount = normalizeAmount(
      tx.token,
      primaryCurrency || "USD",
      Number(ethers.formatUnits(tx.value, tx.token.decimals || 18)),
      new Date(tx.timestamp * 1000)
    );
    acc[tokenType][transactionDirection] += amount;
    return acc;
  }, {} as Record<string, { inbound: number; outbound: number; internal: number }>);
}

export function getTransactionDirection(
  tx: Transaction,
  accountAddresses: Address[]
): TransactionDirection | undefined {
  if (
    !accountAddresses ||
    accountAddresses.length === 0 ||
    !accountAddresses.map
  ) {
    return undefined;
  }
  const addresses = accountAddresses
    .filter((a) => !!a) // make sure no undefined addresses
    .map((a) => a.toLowerCase());
  if (addresses.includes(tx.to.toLowerCase())) {
    if (addresses.includes(tx.from.toLowerCase())) {
      return "internal";
    } else {
      return "inbound";
    }
  } else if (addresses.includes(tx.from.toLowerCase())) {
    return "outbound";
  }
}
/**
 * Compute token stats for a given account
 * @param transactions - Transactions to process
 * @param accountAddresses - Account addresses to define direction (inbound, outbound, internal)
 * @param tokens - Tokens to compute stats for
 * @returns Token stats indexed by token chain:address
 */
export function computeTokenStats(
  transactions: Transaction[],
  accountAddresses?: Address[],
  tokens?: Token[]
): Record<string, TokenStats> {
  return transactions.reduce((acc, tx) => {
    const tokenKey = `${tx.token.chain}:${tx.token.address}`;
    const token = tokens?.find(
      (t) => t.address === tx.token.address && t.chain === tx.token.chain
    );
    if (!token) {
      return acc;
    }
    if (!acc[tokenKey]) {
      acc[tokenKey] = {
        token,
        stats: {
          inbound: {
            count: 0,
            value: 0,
          },
          outbound: {
            count: 0,
            value: 0,
          },
          internal: {
            count: 0,
            value: 0,
          },
          all: {
            count: 0,
            value: 0,
            net: 0,
          },
        },
      };
    }
    const amount = Number(
      ethers.formatUnits(tx.value, tx.token.decimals || 18)
    );
    const direction = getTransactionDirection(
      tx,
      accountAddresses || [
        "0x0000000000000000000000000000000000000000" as Address,
      ]
    );
    if (!direction || direction === "all") {
      return acc;
    }
    acc[tokenKey].stats[direction].count += 1;
    acc[tokenKey].stats[direction].value += amount;
    acc[tokenKey].stats.all.value += amount;
    if (direction === "inbound") {
      acc[tokenKey].stats.all.net! += amount;
    } else if (direction === "outbound") {
      acc[tokenKey].stats.all.net! -= amount;
    }

    acc[tokenKey].stats.all.count += 1;
    return acc;
  }, {} as Record<string, TokenStats>);
}
