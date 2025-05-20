"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TransactionRow } from "@/components/TransactionRow";
import { isWithinInterval } from "date-fns";
import { Loader2, X } from "lucide-react";
import type { Address, URI, Transaction } from "@/types";
import { useNostr } from "@/providers/NostrProvider";
import StatsCards from "./StatsCards";
import Filters, { type Filter } from "./Filters";
import { computeTokenStats, generateURI } from "@/lib/utils";
import Pagination from "./Pagination";
import { ethers } from "ethers";

interface Props {
  transactions: Transaction[];
  accountAddresses?: Address[];
  collectiveSlug: string;
  limit?: number;
  live?: boolean;
  filter: Filter;
}

const LIMIT_PER_PAGE = 20;

function applyTxFilter(
  tx: Transaction,
  transactionsFilter: Filter,
  accountAddresses: Address[] | undefined
): boolean {
  // Apply date filter
  if (
    transactionsFilter.dateRange?.start &&
    transactionsFilter.dateRange?.end
  ) {
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

  // Apply value filter
  if (tx.value === "0") {
    return false;
  } else {
    console.log(">>> applyTxFilter tx.value", tx.value);
  }

  // Apply token filter
  if (
    transactionsFilter.selectedTokens &&
    transactionsFilter.selectedTokens.length > 0
  ) {
    if (
      !tx.token?.address ||
      !transactionsFilter.selectedTokens
        .map((t) => t.address)
        .includes(tx.token?.address)
    ) {
      return false;
    }
  }

  if (transactionsFilter.amountRange) {
    const value = Number(ethers.formatUnits(tx.value, tx.token.decimals));
    if (
      value < transactionsFilter.amountRange[0] ||
      value >= transactionsFilter.amountRange[1]
    ) {
      return false;
    }
  }

  if (transactionsFilter.address) {
    const address = transactionsFilter.address.toLowerCase();
    if (tx.from !== address && tx.to !== address) {
      return false;
    }
  }

  if (accountAddresses && accountAddresses.length > 0) {
    const addresses = accountAddresses
      .filter((a) => !!a)
      .map((a) => a.toLowerCase());
    switch (transactionsFilter.direction) {
      case "internal":
        return addresses.includes(tx.to) && addresses.includes(tx.from);
      case "inbound":
        return addresses.includes(tx.to);
      case "outbound":
        return addresses.includes(tx.from);
      case "all":
        return addresses.includes(tx.to) || addresses.includes(tx.from);
    }
  }

  return true;
}

export default function Transactions({
  transactions,
  accountAddresses,
  collectiveSlug,
  limit,
  live,
  filter,
}: Props) {
  const [isLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [txsPerPage, setTxsPerPage] = useState(limit || LIMIT_PER_PAGE);
  const { subscribeToNotesByURI } = useNostr();
  const [transactionsFilter, setTransactionsFilter] = useState<Filter>({
    dateRange: {
      start: null,
      end: null,
      label: "All Time",
    },
    amountRange: undefined,
    direction: filter.direction || "all",
    address: filter.address,
    tokenType: filter.tokenType,
    selectedTokens: filter.selectedTokens || [],
  });
  const [error, setError] = useState<string | null>(null);

  // Get unique token symbols from transactions
  const availableTokens = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      console.log("No transactions or invalid format:", transactions);
      return [];
    }

    try {
      const tokenStats = computeTokenStats(
        transactions,
        accountAddresses,
        filter.selectedTokens
      );
      return Object.values(tokenStats)
        .filter(
          (tokenStats) =>
            tokenStats.stats.outbound.count > 0 ||
            tokenStats.stats.inbound.count > 1
        )
        .map((tokenStats) => tokenStats.token);
    } catch (error) {
      console.error("Error processing tokens:", error);
      return [];
    }
  }, [transactions, accountAddresses, filter.selectedTokens]);

  if (live) {
    console.log(">>> live updating tokens", availableTokens);
  }

  // Filter transactions based on both date and tokens
  const filteredTransactions = useMemo(() => {
    return transactions.length > 0
      ? transactions.filter((tx) =>
          applyTxFilter(tx, transactionsFilter, accountAddresses)
        )
      : [];
  }, [transactions, transactionsFilter, accountAddresses]);

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
      if (tx.token?.address) {
        uris.add(
          generateURI("ethereum", {
            chainId: tx.chainId,
            address: tx.token.address,
          })
        );
      }
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
    (transactionsFilter.selectedTokens || []).length > 0
      ? transactionsFilter.selectedTokens
      : availableTokens.length === 1
      ? availableTokens
      : [];
  return (
    <div className="space-y-6">
      {/* Filters */}
      {transactions.length > txsPerPage && (
        <Filters
          availableTokens={availableTokens}
          transactions={transactions}
          accountAddresses={accountAddresses}
          onChange={setTransactionsFilter}
        />
      )}

      {/* Stats Cards */}
      {selectedTokens && selectedTokens.length > 0 && (
        <StatsCards
          accountAddresses={accountAddresses}
          transactions={filteredTransactions}
          tokens={selectedTokens}
        />
      )}

      {/* Transactions List */}
      {currentPageTxs.map((tx, idx) => {
        return (
          <TransactionRow key={idx} tx={tx} collectiveSlug={collectiveSlug} />
        );
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
