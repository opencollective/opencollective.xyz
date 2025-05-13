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
  URI,
  WalletConfig,
} from "@/types";
import { NostrNote } from "@/providers/NostrProvider";
import { npubEncode } from "nostr-tools/nip19";
import { ethers } from "ethers";
import chains from "@/chains.json";
import tokens from "@/tokens.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  txCount: number;
  txVolume: Record<TransactionDirection, number>;
  transactions: Transaction[];
};
export type Leaderboard = LeaderboardEntry[];

const getFxRate = (fromToken: Token, toToken: Token, date: Date) => {
  console.log(
    "getFxRate",
    `${fromToken.chain}:${fromToken.symbol}`,
    `${toToken.chain}:${toToken.symbol}`,
    date.toISOString().split("T")[0]
  );
  return 1;
};

export const getPrimaryToken = (
  chainId: number,
  primaryCurrency: FiatCurrencySymbol
) => {
  const chain = getChainSlugFromChainId(chainId);
  const chainTokens = tokens[chain];
  const keys = Object.keys(chainTokens);
  for (const contractAddress of keys) {
    const token = chainTokens[contractAddress as keyof typeof chainTokens];
    if (!token) continue;
    token.address = contractAddress;
    token.chain = chain;
    if (primaryCurrency === "USD") {
      if (token.symbol === "USDC") {
        return token as Token;
      }
    }
    if (primaryCurrency === "EUR") {
      if (token.symbol === "EURE") {
        return token as Token;
      }
    }
  }
  return null;
};

const normalizeAmount = (
  fromToken: Token | null,
  toToken: Token | null,
  amount: number,
  date: Date
) => {
  if (!fromToken || !toToken) return 0;
  if (fromToken.symbol === toToken.symbol) {
    return amount;
  }
  const fxRate = getFxRate(fromToken, toToken, date);
  return amount * fxRate;
};

const getTokenType = (tokenSymbol: string): TokenType => {
  if (["CHT"].includes(tokenSymbol)) return "token";
  else return "fiat";
};

export function getLeaderboard(
  transactions: Transaction[],
  primaryCurrency: FiatCurrencySymbol,
  direction?: TransactionDirection,
  tokenType?: TokenType
): Leaderboard {
  console.log(
    ">>> getLeaderboard",
    `transactions.length: ${transactions.length}`,
    direction,
    tokenType
  );
  const result: Leaderboard = [];
  const entriesByUri = new Map<string, LeaderboardEntry>();

  const processTransaction = (
    tx: Transaction,
    direction: TransactionDirection
  ) => {
    const uri = generateURI("ethereum", {
      chainId: tx.chainId,
      address: direction === "inbound" ? tx.to : tx.from,
    });

    const amount = normalizeAmount(
      tx.token,
      getPrimaryToken(tx.chainId, primaryCurrency),
      Number(ethers.formatUnits(tx.value, tx.token.decimals)),
      new Date(tx.timestamp * 1000)
    );

    if (!entriesByUri.has(uri)) {
      entriesByUri.set(uri, {
        uri,
        txCount: 0,
        txVolume: {
          inbound: 0,
          outbound: 0,
          internal: 0,
          all: 0,
        },
        transactions: [],
      });
    }

    const entry = entriesByUri.get(uri)!;
    entry.txCount += 1;
    entry.txVolume[direction] += amount;
    entry.txVolume["all"] += amount;
    entry.transactions.push(tx);
  };

  transactions.forEach((tx) => {
    if (direction) {
      processTransaction(tx, direction);
    } else {
      processTransaction(tx, "inbound");
      processTransaction(tx, "outbound");
    }
  });

  entriesByUri.forEach((entry) => {
    result.push(entry);
  });

  // Convert map to array and sort by txVolume descending
  return result.sort(
    (a, b) =>
      b.txVolume.inbound +
      b.txVolume.outbound -
      (a.txVolume.inbound + a.txVolume.outbound)
  );
}

export const generateAvatar = (address: string) => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
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
  wallets: WalletConfig[] | undefined
) {
  if (!wallets) return transactions;
  if (wallets.length === 0) return transactions;
  const walletAddresses = wallets
    .filter((w) => !!w.address)
    .map((w) => w.address.toLowerCase());

  const txs = transactions.filter((tx) => {
    if (!tx.token.symbol) return false;
    if (getTokenType(tx.token.symbol) !== tokenType) return false;

    if (direction === "inbound") {
      return (
        walletAddresses.includes(tx.to.toLowerCase()) &&
        !walletAddresses.includes(tx.from.toLowerCase())
      );
    }
    if (direction === "outbound") {
      return (
        walletAddresses.includes(tx.from.toLowerCase()) &&
        !walletAddresses.includes(tx.to.toLowerCase())
      );
    }
    if (direction === "internal") {
      return (
        walletAddresses.includes(tx.to.toLowerCase()) ||
        walletAddresses.includes(tx.from.toLowerCase())
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
  wallets: WalletConfig[]
): Record<
  string,
  { inbound: number; outbound: number; internal: number }
> | null {
  if (!wallets) return null;
  if (wallets.length === 0) return null;

  const walletAddressesByChain: Record<number, Address[]> = {};
  wallets
    .filter((w) => {
      return w.type === "blockchain" && w.address && w.address.length === 42;
    })
    .map((w) => {
      const chainId = getChainIdFromChainSlug(w.chain);
      if (!chainId) return;
      walletAddressesByChain[chainId] = walletAddressesByChain[chainId] || [];
      walletAddressesByChain[chainId].push(w.address.toLowerCase() as Address);
    });

  const totals = transactions.reduce((acc, tx) => {
    if (!tx.token.symbol) {
      return acc;
    }
    const tokenType = getTokenType(tx.token.symbol);

    // Initialize token group if it doesn't exist
    if (!acc[tokenType]) {
      acc[tokenType] = {
        inbound: 0,
        outbound: 0,
        internal: 0,
      };
    }

    const amount = Number(ethers.formatUnits(tx.value, tx.token.decimals));

    const transactionDirection = getTransactionDirection(
      tx,
      walletAddressesByChain[tx.chainId]
    );
    if (!transactionDirection) {
      return acc;
    }
    // If the account is the recipient (to address), it's an inflow
    acc[tokenType][transactionDirection] += amount;

    return acc;
  }, {} as Record<string, { inbound: number; outbound: number; internal: number }>);

  return totals;
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
        txCount: 0,
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
        netValue: 0,
        totalVolume: 0,
      };
    }
    const amount = Number(ethers.formatUnits(tx.value, tx.token.decimals));
    const direction = getTransactionDirection(
      tx,
      accountAddresses || [
        "0x0000000000000000000000000000000000000000" as Address,
      ]
    );
    if (!direction) {
      return acc;
    }
    acc[tokenKey][direction].count += 1;
    acc[tokenKey][direction].value += amount;
    if (direction === "inbound") {
      acc[tokenKey].netValue += amount;
    } else if (direction === "outbound") {
      acc[tokenKey].netValue -= amount;
    }

    acc[tokenKey].txCount += 1;
    acc[tokenKey].totalVolume += amount;
    return acc;
  }, {} as Record<string, TokenStats>);
}
