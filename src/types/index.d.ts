type HexString<Length extends number> = `0x${string}` & { length: Length };
export type Address = HexString<42>;

type BitcoinAddress =
  | `1${string}` // Legacy addresses
  | `3${string}` // P2SH addresses
  | `bc1${string}`; // Native SegWit addresses

export type TxHash = HexString<66>;
export type TxId = HexString<64>;
export type ChainId = number;
export type Blockchain = "ethereum" | "bitcoin";
export type AddressType = "address" | "tx";
export type URI =
  | `ethereum:${ChainId}:address:${Address}`
  | `ethereum:${ChainId}:tx:${TxHash}`
  | `bitcoin:address:${BitcoinAddress}`
  | `bitcoin:tx:${TxId}`;

export type Token = {
  name?: string;
  symbol?: string;
  address: Address;
  decimals?: number;
};

export type TokenStats = {
  token: Token;
  txCount: number;
  inbound: {
    count: number;
    value: number;
  };
  outbound: {
    count: number;
    value: number;
  };
  totalVolume: number;
  netValue: number;
};
export interface Transaction {
  blockNumber: number;
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
