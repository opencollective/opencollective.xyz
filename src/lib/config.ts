import config from "@/config.json";
import tokens from "@/data/tokens.json";
import { Address, CollectiveConfig, Token, WalletConfig } from "@/types";

// Add type for tokens structure
type TokensRecord = Record<Address, Token>;
type TokensByChain = Record<string, TokensRecord>;

const knownTokens = tokens as TokensByChain;

export const getCollectiveConfig = (
  collectiveSlug?: string
): CollectiveConfig | undefined => {
  return config.collectives.find((c) => c.slug === collectiveSlug) as
    | CollectiveConfig
    | undefined;
};

export const getWallets = (collectiveSlug: string) => {
  const collectiveConfig = getCollectiveConfig(collectiveSlug);
  if (!collectiveConfig) {
    throw new Error(`Collective ${collectiveSlug} not found`);
  }
  return collectiveConfig.wallets;
};

export const getWalletAddresses = (collectiveSlug: string): Address[] => {
  const wallets = getWallets(collectiveSlug);
  const addresses = wallets
    .filter((w) => !!w.address)
    .map((w) => w.address.toLowerCase() as Address);
  const uniqueAddresses = [...new Set(addresses)];
  return uniqueAddresses;
};

export const getTokenDetailsFromAddress = (
  chain: string,
  address: string
): Token | undefined => {
  if (!chain || !address) {
    return undefined;
  }

  const token = Object.keys(knownTokens[chain]).find(
    (tokenAddress) => tokenAddress.toLowerCase() === address.toLowerCase()
  );
  if (!token) {
    return {
      chain,
      address: address.toLowerCase() as Address,
    };
  }
  return {
    ...knownTokens[chain][token as Address],
    address: address.toLowerCase() as Address,
    chain,
  };
};

export const getTokensForWallet = (wallet: WalletConfig): Token[] => {
  if (!wallet.chain) {
    return [];
  }
  const tokenAddresses = getTokenAddressesFromSymbols(
    wallet.chain,
    wallet.tokens
  );
  return tokenAddresses
    .map((address) => getTokenDetailsFromAddress(wallet.chain, address))
    .filter((token) => token !== undefined);
};

export const getTokenAddressesFromSymbols = (
  chain: string,
  symbols: string[]
): Address[] => {
  const tokensForChain = tokens[chain as keyof typeof tokens] as TokensRecord;
  if (!tokensForChain) {
    throw new Error(`Chain ${chain} not found`);
  }
  return Object.keys(tokensForChain)
    .filter((tokenAddress) =>
      symbols.includes(tokensForChain[tokenAddress as Address].symbol ?? "")
    )
    .map((a) => a.toLowerCase()) as Address[];
};
