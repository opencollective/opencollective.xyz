"use client";

import { useEffect, useState } from "react";
import MonthlySection from "@/components/MonthlySection";
import {
  getTransactionsForCollective,
  getUniqueTokensFromTransactions,
} from "@/lib/transactions";
import type { CollectiveConfig, Transaction } from "@/types";
import GlobalLeaderboard from "./GlobalLeaderboard";

export default function CollectivePageContent({
  collectiveConfig,
}: {
  collectiveConfig: CollectiveConfig;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const txs = await getTransactionsForCollective(collectiveConfig.slug);
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [collectiveConfig.slug]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        Loading data...
      </div>
    );
  }

  // Get the oldest transaction timestamp
  const oldestTxTimestamp = Math.min(...transactions.map((tx) => tx.timestamp));
  const oldestTxDate = new Date(oldestTxTimestamp * 1000);

  // Calculate number of months between now and oldest transaction
  const now = new Date();
  const monthDiff =
    (now.getFullYear() - oldestTxDate.getFullYear()) * 12 +
    (now.getMonth() - oldestTxDate.getMonth());

  const pastMonths = Array.from({ length: monthDiff + 1 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  // Filter transactions by month
  const filterTransactions = (start: Date, end: Date) => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp * 1000);
      return txDate >= start && txDate <= end;
    });
  };

  const tokens = getUniqueTokensFromTransactions(transactions);

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="mt-2 sm:mt-4">
        <h2 className="text-xl sm:text-2xl font-bold mt-2 sm:mt-4 mb-8 sm:mb-8">
          Our financials
        </h2>
        <GlobalLeaderboard
          transactions={transactions}
          collectiveConfig={collectiveConfig}
        />
      </div>
      <div className="mt-4 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-0 sm:mb-4">
          Transactions by month
        </h2>
        <div className="flex flex-col gap-8 sm:gap-16">
          {pastMonths.map((month, i) => (
            <MonthlySection
              key={month.label}
              filter={{
                dateRange: {
                  start: month.start,
                  end: month.end,
                  label: month.label,
                },
                selectedTokens: tokens,
              }}
              transactions={filterTransactions(month.start, month.end)}
              live={i === 0}
              collectiveConfig={collectiveConfig}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
