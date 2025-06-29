type HexString<Length extends number> = `0x${string}` & { length: Length };
export type Address = Lowercase<HexString<42>>;

type BitcoinAddress =
  | `1${string}` // Legacy addresses
  | `3${string}` // P2SH addresses
  | `bc1${string}`; // Native SegWit addresses

export type TxHash = HexString<66>;
export type TxId = HexString<64>;
export type ChainId = number;
export type Blockchain = "ethereum" | "bitcoin";
export type AddressType = "address" | "tx";
export type TransactionDirection = "inbound" | "outbound" | "internal" | "all";
export type TokenType = "fiat" | "token";
export type URI =
  | `ethereum:${ChainId}:address:${Address}`
  | `ethereum:${ChainId}:tx:${TxHash}`
  | `bitcoin:address:${BitcoinAddress}`
  | `bitcoin:tx:${TxId}`;

export type FiatCurrencySymbol =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CHF"
  | "CAD"
  | "AUD"
  | "NZD"
  | "CNY"
  | "HKD"
  | "SGD"
  | "INR";

export type Token = {
  name?: string;
  symbol?: string;
  chain: string;
  address: Address;
  decimals?: number;
  imageUrl?: string;
};

export type TxStats = Record<
  TransactionDirection,
  {
    count: number;
    value: number;
    net?: number;
  }
>;

export type TokenStats = {
  token: Token;
  stats: TxStats;
};

export interface Transaction {
  blockNumber: number;
  chainId: number;
  txHash: TxHash;
  txIndex?: number;
  logIndex?: number;
  timestamp: number;
  from: Address;
  to: Address;
  value: string;
  token: Token;
}

/**
 * Etherscan API response for token transfers
 */
export type EtherscanResponse = {
  status: string;
  message: string;
  result: EtherscanTransfer[];
};

export type EtherscanTransfer = {
  blockNumber: number;
  timeStamp: number;
  hash: TxHash;
  nonce: number;
  blockHash: TxHash;
  from: Address;
  contractAddress: Address;
  to: Address;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: number;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

export type ChainConfig = {
  id: number;
  explorer_url: string;
  explorer_api?: string;
  explorer_name: string;
  rpc: string | string[];
  ws?: string | string[];
};

export type WalletConfig = {
  type: "blockchain" | "opencollective";
  chain: string;
  address: string;
  tokens: string[]; // token symbols
  hostSlug?: string;
  collectiveSlug?: string;
  currency?: string;
};

export type Price = {
  amount: number;
  currency: FiatCurrencySymbol;
  frequency?: "monthly" | "yearly";
  label?: string;
  discount?: number;
  tax?: {
    amount: number;
    label: string;
    included: boolean;
  };
  stripeLink: string;
};

export type Theme = {
  primaryColor: string;
  secondaryColor: string;
};

export type Product = {
  name: string;
  description: string;
  website: string;
  prices: Price[];
};

export type CollectiveConfig = {
  slug: string;
  products: Product[];
  tokens?: Token[];
  wallets: WalletConfig[];
  primaryCurrency: FiatCurrencySymbol;
  profile: ProfileData;
  theme?: Theme;
  ignoreTxs?: string[];
};

export type ProfileData = {
  uri?: URI;
  address?: Address | undefined;
  name?: string;
  about?: string;
  picture?: string;
  website?: string;
};
