import { useCallback, useRef, useState } from "react";
import { JsonRpcProvider, WebSocketProvider, Log, ethers } from "ethers";
import chains from "@/chains.json";
import { Address, ChainConfig, Transaction } from "@/types";
import { getTxFromLog } from "@/utils/crypto";

const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

const getFilters = (
  tokenAddress: Address | undefined,
  accountAddress: Address | undefined
) => {
  if (tokenAddress) {
    if (accountAddress) {
      const filters = [
        {
          topics: [TRANSFER_TOPIC, ethers.zeroPadValue(accountAddress, 32)],
          address: tokenAddress,
        },
        {
          topics: [
            TRANSFER_TOPIC,
            null,
            ethers.zeroPadValue(accountAddress, 32),
          ],
          address: tokenAddress,
        },
      ];
      return filters;
    } else {
      const filter = {
        topics: [TRANSFER_TOPIC],
        address: tokenAddress,
      };
      return [filter];
    }
  } else if (accountAddress) {
    const filters = [
      { topics: [TRANSFER_TOPIC, ethers.zeroPadValue(accountAddress, 32)] },
      {
        topics: [TRANSFER_TOPIC, null, ethers.zeroPadValue(accountAddress, 32)],
      },
    ];
    return filters;
  }
  return [];
};

export function useLiveTransactions({
  maxTransactionsPerMinute = 100, // default limit
}: {
  maxTransactionsPerMinute?: number;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, string | boolean>
  >({});
  const [intervalId, setIntervalId] = useState<
    Record<string, NodeJS.Timeout | undefined>
  >({});
  const last10ProcessedTxTimestamp = useRef<number[]>([0]);
  const skippedTransactionsRef = useRef<number>(0);
  const [skippedTransactions, setSkippedTransactions] = useState<number>(0);
  const timePer10Transactions = Math.ceil(
    (60 * 1000) / maxTransactionsPerMinute
  );

  const getStreamKey = (
    chain: string,
    tokenAddress?: Address,
    accountAddress?: Address
  ) => {
    return `${chain}-${tokenAddress || "all"}-${accountAddress || "all"}`;
  };

  const processLog = useCallback(
    async (chain: string, log: Log, httpProvider: JsonRpcProvider) => {
      const tx = await getTxFromLog(chain, log, httpProvider);
      setTransactions((prev) => ({
        ...prev,
        tx,
      }));
    },
    []
  );

  const throttledProcessLog = useCallback(
    async (chain: string, log: Log, httpProvider: JsonRpcProvider) => {
      const now = Date.now();
      if (
        skippedTransactionsRef.current === 0 &&
        last10ProcessedTxTimestamp.current[
          last10ProcessedTxTimestamp.current.length - 1
        ] <
          now - timePer10Transactions
      ) {
        last10ProcessedTxTimestamp.current = [
          now,
          ...last10ProcessedTxTimestamp.current,
        ].slice(0, 10);
        await processLog(chain, log, httpProvider);
      } else {
        skippedTransactionsRef.current++;
        setSkippedTransactions(skippedTransactionsRef.current);
        if (skippedTransactionsRef.current === 1) {
          console.warn(
            `Rate limit of ${maxTransactionsPerMinute} transactions per minute reached, now counting skipped transactions`
          );
        }
      }
    },
    [maxTransactionsPerMinute, processLog, timePer10Transactions]
  );

  const startPolling = useCallback(
    async (options: Required<Options>) => {
      const { chain, tokenAddress, accountAddress, fromBlock, interval } =
        options;
      const streamKey = getStreamKey(chain, tokenAddress, accountAddress);
      if (connectionStatus[streamKey] === "polling") {
        return;
      }
      setConnectionStatus((prev) => ({
        ...prev,
        [streamKey]: "polling",
      }));
      const chainConfig: ChainConfig = chains[chain as keyof typeof chains];
      const httpProvider = new JsonRpcProvider(chainConfig.rpc[0]);
      const filters = getFilters(tokenAddress, accountAddress);
      let lastBlock = fromBlock;
      let processingBacklog = false;

      const processBlockRange = async () => {
        if (processingBacklog) return;

        const blockNumber = await httpProvider.getBlockNumber();
        if (lastBlock === blockNumber) return;

        lastBlock = lastBlock ?? blockNumber - 1000;

        while (lastBlock < blockNumber) {
          processingBacklog = true;
          const toBlock = Math.min(lastBlock + 1000, blockNumber);
          let logsReceived = 0;
          await Promise.all(
            filters.map(async (filter) => {
              const logs = await httpProvider.getLogs({
                ...filter,
                fromBlock: lastBlock,
                toBlock,
              });
              logsReceived += logs.length;
              await Promise.all(
                logs.map((log) => throttledProcessLog(chain, log, httpProvider))
              );
            })
          );
          processingBacklog = false;
          lastBlock = toBlock;
          await new Promise((resolve) =>
            setTimeout(resolve, logsReceived * 500)
          );
        }
      };

      processBlockRange();
      const intervalId = setInterval(processBlockRange, interval ?? 20000);
      setIntervalId((prev) => ({
        ...prev,
        [streamKey]: intervalId,
      }));
      return () => clearInterval(intervalId);
    },
    [throttledProcessLog]
  );

  const startWebsocket = useCallback(
    (options: Required<Options>) => {
      const { chain, tokenAddress, accountAddress } = options;
      const streamKey = getStreamKey(chain, tokenAddress, accountAddress);
      if (connectionStatus[streamKey] === "websocket") {
        return;
      }
      const chainConfig: ChainConfig = chains[chain as keyof typeof chains];

      if (!chainConfig.ws) {
        console.error(`No WebSocket configuration found for chain ${chain}`);
        return;
      }

      const wsUrl = chainConfig.ws[0]; // We can add error handling rotation later
      const wsProvider = new WebSocketProvider(wsUrl);
      const httpProvider = new JsonRpcProvider(chainConfig.rpc[0]);

      const filters = getFilters(tokenAddress, accountAddress);

      filters.forEach((filter) =>
        wsProvider.on(filter, (log) => {
          throttledProcessLog(chain, log, httpProvider);
        })
      );

      setConnectionStatus((prev) => ({
        ...prev,
        [streamKey]: "websocket",
      }));

      return () => {
        wsProvider.removeAllListeners();
        setConnectionStatus((prev) => ({
          ...prev,
          [streamKey]: false,
        }));
      };
    },
    [throttledProcessLog]
  );

  type Options = {
    chain: string;
    tokenAddress?: Address;
    accountAddress?: Address;
    fromBlock?: number;
    websocket?: boolean;
    interval?: number;
  };

  const start = useCallback(
    (options: Options) => {
      const chainConfig: ChainConfig =
        chains[options.chain as keyof typeof chains];

      if (!options.websocket || !chainConfig?.ws) {
        return startPolling(options as Required<Options>);
      }

      return startWebsocket(options as Required<Options>);
    },
    [startWebsocket, startPolling]
  );

  const stop = useCallback(
    (chain: string, tokenAddress: Address, accountAddress: Address) => {
      const streamKey = getStreamKey(chain, tokenAddress, accountAddress);
      // make sure we clear the interval
      if (!intervalId[streamKey]) {
        return;
      }
      clearInterval(intervalId[streamKey]);
      setIntervalId((prev) => ({
        ...prev,
        [streamKey]: undefined,
      }));

      setConnectionStatus((prev) => ({
        ...prev,
        [streamKey]: false,
      }));
    },
    [intervalId]
  );

  return {
    transactions,
    connectionStatus,
    skippedTransactions,
    start,
    stop,
  };
}
