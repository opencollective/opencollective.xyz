"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import { TransactionRow } from "@/components/TransactionRow";
import { isWithinInterval } from "date-fns";
import { Loader2, X } from "lucide-react";
import type { Address, TokenStats, URI, Transaction } from "@/types";
import { useNostr } from "@/providers/NostrProvider";
import StatsCards from "./StatsCards";
import Filters, { type Filter } from "./Filters";
import { generateURI } from "@/lib/utils";
import { ethers } from "ethers";
import Pagination from "./Pagination";
interface Props {
  transactions: Transaction[];
  accountAddress?: Address;
}

const LIMIT_PER_PAGE = 20;

function applyTxFilter(
  tx: Transaction,
  transactionsFilter: Filter,
  accountAddress: Address | undefined
): boolean {
  // Apply date filter
  if (transactionsFilter.dateRange.start && transactionsFilter.dateRange.end) {
    const txDate = new Date(tx.timestamp * 1000);
    if (
      !isWithinInterval(txDate, {
        start: transactionsFilter.dateRange.start!,
        end: transactionsFilter.dateRange.end!,
      })
    ) {
      return false;
    }
  }

  // Apply token filter
  if (transactionsFilter.selectedTokens.length > 0) {
    if (
      !tx.token?.address ||
      !transactionsFilter.selectedTokens
        .map((t) => t.address)
        .includes(tx.token?.address)
    ) {
      return false;
    }
  }

  if (accountAddress && transactionsFilter.type === "in") {
    return tx.to === accountAddress.toLowerCase();
  } else if (accountAddress && transactionsFilter.type === "out") {
    return tx.from === accountAddress.toLowerCase();
  }
  return true;
}

export default function Transactions({ transactions, accountAddress }: Props) {
  const [isLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [txsPerPage, setTxsPerPage] = useState(LIMIT_PER_PAGE);
  const { subscribeToNotesByURI } = useNostr();
  const [transactionsFilter, setTransactionsFilter] = useState<Filter>({
    dateRange: {
      start: null,
      end: null,
      label: "All Time",
    },
    type: "all",
    selectedTokens: [],
  });

  const [error, setError] = useState<string | null>(null);

  const referenceAccount = accountAddress
    ? accountAddress
    : "0x0000000000000000000000000000000000000000";

  // Get unique token symbols from transactions
  const availableTokens = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      console.log("No transactions or invalid format:", transactions);
      return [];
    }

    try {
      const tokenMap: Record<Address, TokenStats> = {};
      transactions.forEach((tx) => {
        if (
          tx.token?.address &&
          tx.token?.symbol &&
          tx.token?.symbol?.length > 0 &&
          tx.token?.symbol?.length <= 6
        ) {
          const tokenStats = tokenMap[
            tx.token.address.toLowerCase() as Address
          ] || {
            token: tx.token,
            txCount: 0,
            inbound: {
              count: 0,
              value: 0,
            },
            outbound: {
              count: 0,
              value: 0,
            },
            totalVolume: 0,
            netValue: 0,
          };
          tokenStats.txCount++;
          const value = Number(ethers.formatUnits(tx.value, tx.token.decimals));
          if (tx.from === referenceAccount.toLowerCase()) {
            tokenStats.outbound.count++;
            tokenStats.outbound.value += value;
            tokenStats.netValue -= value;
          } else if (tx.to === referenceAccount.toLowerCase()) {
            tokenStats.inbound.count++;
            tokenStats.inbound.value += value;
            tokenStats.netValue += value;
          }
          tokenStats.totalVolume =
            tokenStats.inbound.value + tokenStats.outbound.value;
          tokenMap[tx.token.address.toLowerCase() as Address] = tokenStats;
        }
      });
      return Object.values(tokenMap)
        .filter(
          (tokenStats) =>
            tokenStats.outbound.count > 0 || tokenStats.inbound.count > 1
        )
        .map((tokenStats) => tokenStats.token);
    } catch (error) {
      console.error("Error processing tokens:", error);
      return [];
    }
  }, [transactions, referenceAccount]);

  // Filter transactions based on both date and tokens
  const filteredTransactions = useMemo(() => {
    return transactions.length > 0
      ? transactions.filter((tx) =>
          applyTxFilter(tx, transactionsFilter, accountAddress)
        )
      : [];
  }, [transactions, transactionsFilter, accountAddress]);

  const currentPageTxs = useMemo(
    () =>
      filteredTransactions.slice(
        (currentPage - 1) * txsPerPage,
        currentPage * txsPerPage
      ),
    [filteredTransactions, currentPage, txsPerPage]
  );

  // Subscribe to notes for all displayed transactions
  useEffect(() => {
    const uris = new Set<URI>();
    currentPageTxs.slice(0, LIMIT_PER_PAGE).forEach((tx: Transaction) => {
      uris.add(
        generateURI("ethereum", {
          chainId: tx.chainId,
          address: tx.token?.address,
        })
      );
      uris.add(
        generateURI("ethereum", { chainId: tx.chainId, address: tx.from })
      );
      uris.add(
        generateURI("ethereum", { chainId: tx.chainId, address: tx.to })
      );
      uris.add(
        generateURI("ethereum", { chainId: tx.chainId, txHash: tx.txHash })
      );
    });

    subscribeToNotesByURI(Array.from(uris) as URI[]);
  }, [currentPageTxs, subscribeToNotesByURI]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-24">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const totalPages = Math.ceil(filteredTransactions.length / txsPerPage);
  const selectedTokens =
    transactionsFilter.selectedTokens.length > 0
      ? transactionsFilter.selectedTokens
      : availableTokens.length === 1
      ? availableTokens
      : [];
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Filters
        availableTokens={availableTokens}
        transactions={transactions}
        accountAddress={accountAddress as Address}
        onChange={setTransactionsFilter}
      />

      {/* Stats Cards */}
      {selectedTokens.length > 0 && (
        <StatsCards
          accountAddress={accountAddress as Address}
          transactions={filteredTransactions}
          tokens={selectedTokens}
          timeRangeLabel={transactionsFilter.dateRange.label}
        />
      )}

      {/* Transactions List */}
      {currentPageTxs.map((tx, idx) => {
        return <TransactionRow key={idx} tx={tx} />;
      })}

      {/* pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        txsPerPage={txsPerPage}
        onPageChange={setCurrentPage}
        onTxsPerPageChange={setTxsPerPage}
      />

      {error && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
          <div className="container max-w-7xl mx-auto space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground items-center">
              <span>{error}</span>
              <Button variant="ghost" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
