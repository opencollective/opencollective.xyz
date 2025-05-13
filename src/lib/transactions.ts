import { getCollectiveConfig, getTokenAddressesFromSymbols } from "./config";

import {
  Address,
  EtherscanTransfer,
  Token,
  Transaction,
  WalletConfig,
} from "@/types";
import { getTokenDetailsFromAddress } from "./config";
import chains from "@/chains.json";
import { getTransactions } from "./crypto";

export const getTransactionsForCollective = async (
  collectiveSlug: string,
  year?: number,
  month?: number
): Promise<Transaction[]> => {
  const collectiveConfig = getCollectiveConfig(collectiveSlug);
  if (!collectiveConfig) {
    throw new Error(`Collective ${collectiveSlug} not found`);
  }

  const transactions: Transaction[] = [];

  const ignoreTxs = [
    "0x42262de0f79d40de757f8fd08afb1927d693b7f033ff6fc828c1d30d19dfefa3",
    "0x1a93cfa2f712079e9ee4657ab22eb6f170dfbbd1d559991e759d364690008ffb",
  ];
  const addTransactions = (
    chain: string,
    txs: EtherscanTransfer[],
    token?: Token
  ) => {
    if (txs.length === 0) {
      return;
    }
    if (year) {
      txs = txs.filter((tx) => {
        const txDate = new Date(tx.timeStamp * 1000);
        if (month) {
          return (
            txDate.getFullYear() === year && txDate.getMonth() + 1 === month
          );
        }
        return txDate.getFullYear() === year;
      });
    }
    txs?.forEach((tx) => {
      if (ignoreTxs.includes(tx.hash)) {
        return;
      }
      transactions.push({
        blockNumber: tx.blockNumber,
        chainId: chains[chain as keyof typeof chains].id,
        txHash: tx.hash,
        timestamp: tx.timeStamp,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        token: token || {
          chain,
          address: tx.contractAddress as Address,
          symbol: tx.tokenSymbol,
          decimals: parseInt(tx.tokenDecimal),
          name: tx.tokenName,
        },
      });
    });
  };

  const tokens = [];
  await Promise.all(
    collectiveConfig.tokens?.map(async (token) => {
      const txs = await getTransactions(token.chain, token.address as Address);
      if (txs?.length > 0) {
        addTransactions(token.chain, txs, token as Token);
        tokens.push(token);
      }
    }) || []
  );
  // Wait for all wallet processing to complete
  await Promise.all(
    (collectiveConfig.wallets as WalletConfig[]).map(async (wallet) => {
      if (wallet.type === "blockchain") {
        // Wait for all token processing within each wallet
        if (!wallet.chain) {
          throw new Error(`No chain defined for wallet ${wallet.address}`);
        }
        const tokenAddresses = getTokenAddressesFromSymbols(
          wallet.chain,
          wallet.tokens.map((t) => t.symbol ?? "")
        );
        const txs = await getTransactions(
          wallet.chain,
          null,
          wallet.address.split("/")[0]
        );
        if (txs?.length > 0) {
          addTransactions(
            wallet.chain,
            txs.filter((tx) =>
              tokenAddresses
                ? tokenAddresses.includes(
                    tx.contractAddress?.toLowerCase() as Address
                  )
                : true
            )
          );
        }
        const txsNative = await getTransactions(
          wallet.chain,
          null,
          wallet.address.split("/")[0],
          "native"
        );
        if (txsNative.length > 0) {
          addTransactions(
            wallet.chain,
            txsNative,
            getTokenDetailsFromAddress(wallet.chain, "native")
          );
        }
      }
    })
  );

  transactions.sort((a, b) => b.timestamp - a.timestamp);
  console.log(">>> transactions.length", transactions.length);
  return transactions;
};

export const getUniqueTokensFromTransactions = (
  transactions: Transaction[]
): Token[] => {
  const tokenChainAddresses: Record<string, Token> = {};
  transactions
    .filter((tx) => tx.token.chain)
    .map((tx) => {
      const key = `${tx.token.chain}:${tx.token.address.toLowerCase()}`;
      if (!tokenChainAddresses[key]) {
        const tokenDetails = getTokenDetailsFromAddress(
          tx.token.chain,
          tx.token.address
        );
        if (tokenDetails) {
          tokenChainAddresses[key] = tokenDetails;
        }
      }
    });

  const res = Object.values(tokenChainAddresses);
  return res;
};
