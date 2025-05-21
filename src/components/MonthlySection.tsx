"use client";

import {
  Address,
  CollectiveConfig,
  TokenType,
  Transaction,
  TransactionDirection,
  URI,
} from "@/types";
import TransactionsList from "./TransactionsList";
import { useEffect, useState } from "react";
import { useLiveTransactions } from "@/hooks/useLiveTransactions";
import SideSummary from "./SideSummary";
import { getWallets } from "@/lib/config";
import { generateURI, getAddressFromURI } from "@/lib/utils";
import type { Filter } from "./Filters";
import AddressInfo from "./AddressInfo";
import { useRouter } from "next/navigation";

export default function MonthlySection({
  transactions: initialTransactions,
  collectiveConfig,
  filter,
  limit,
  live,
}: {
  transactions: Transaction[];
  collectiveConfig: CollectiveConfig;
  filter: Filter;
  limit?: number;
  live?: boolean;
}) {
  const router = useRouter();

  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const { transactions: newTransactions, start } = useLiveTransactions({});

  const wallets = getWallets(collectiveConfig.slug);
  useEffect(() => {
    if (live) {
      collectiveConfig.tokens?.forEach((token) => {
        console.log(
          "Starting live updates for token",
          token.symbol,
          token.chain,
          token.address
        );
        start({
          chain: token.chain,
          tokenAddress: token.address,
        });
      });
      wallets.forEach((wallet) => {
        console.log("Starting live updates for wallet", wallet.address);
        start({
          chain: wallet.chain,
          accountAddress: wallet.address as Address,
        });
      });
    }
  }, [collectiveConfig, live, start, wallets]);

  useEffect(() => {
    if (newTransactions.length > 0) {
      setTransactions((prev) => {
        return [...prev, ...newTransactions];
      });
    }
  }, [newTransactions]);

  const handleProfileClick = ({
    uri,
    direction,
    tokenType,
  }: {
    uri: URI;
    direction: TransactionDirection;
    tokenType: TokenType;
  }) => {
    const address = getAddressFromURI(uri);
    const d = new Date(transactions[0].timestamp * 1000);
    if (address) {
      if (filter.address === address) {
        router.push(
          `/${collectiveConfig.slug}/${d.getFullYear()}/${d.getMonth() + 1}`
        );
      } else {
        router.push(
          `/${collectiveConfig.slug}/${d.getFullYear()}/${
            d.getMonth() + 1
          }/${address}?direction=${direction}&tokenType=${tokenType}`
        );
      }
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-start">
        <div className="sm:mb-8 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {filter.dateRange?.label}
          </h2>
          <div className="flex flex-col gap-2">
            <SideSummary
              transactions={transactions}
              collectiveConfig={collectiveConfig}
              onClick={handleProfileClick}
            />
          </div>
        </div>
        <div className="col-span-1 md:col-span-8 h-full">
          {filter.address && (
            <>
              <AddressInfo
                uri={generateURI("ethereum", {
                  chainId: 0,
                  address: filter.address,
                })}
              />
            </>
          )}
          {transactions.length > 0 ? (
            <div className="mt-8">
              <TransactionsList
                transactions={transactions}
                accountAddresses={wallets.map((w) => w.address) as Address[]}
                filter={filter}
                collectiveSlug={collectiveConfig.slug}
                limit={limit || 5}
              />
            </div>
          ) : (
            <div className="text-gray-500 h-full flex items-center justify-center">
              (No transaction)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
