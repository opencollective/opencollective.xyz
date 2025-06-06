import { getCollectiveConfig, getTokenAddressesFromSymbols } from "./config";

import {
  Address,
  EtherscanTransfer,
  Token,
  Transaction,
  WalletConfig,
} from "@/types";
import { getTokenDetailsFromAddress } from "./config";
import chains from "@/data/chains.json";
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

  console.log(">>> getTransactionsForCollective", collectiveConfig);

  const transactions: Transaction[] = [];
  const ignoreTxs = collectiveConfig.ignoreTxs || [];
  const addTransactions = (
    chain: string,
    txs: EtherscanTransfer[],
    token?: Token
  ) => {
    if (!Array.isArray(txs) || txs.length === 0) {
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

        if (wallet.address === "0x0000000000000000000000000000000000000000") {
          return;
        }

        const tokenAddresses = getTokenAddressesFromSymbols(
          wallet.chain,
          wallet.tokens
        );

        const txs = await getTransactions(
          wallet.chain,
          null,
          wallet.address.split("/")[0]
        );
        if (Array.isArray(txs) && txs?.length > 0) {
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
          "txlist"
        );
        if (Array.isArray(txsNative) && txsNative?.length > 0) {
          addTransactions(
            wallet.chain,
            txsNative,
            getTokenDetailsFromAddress(wallet.chain, "native")
          );
        }
        const txsNativeInternal = await getTransactions(
          wallet.chain,
          null,
          wallet.address.split("/")[0],
          "txlistinternal"
        );
        if (Array.isArray(txsNativeInternal) && txsNativeInternal?.length > 0) {
          addTransactions(
            wallet.chain,
            txsNativeInternal,
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
