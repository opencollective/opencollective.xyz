import { computeTokenStats } from "@/lib/utils";
import { useMemo } from "react";
import type { Transaction, Token, Address } from "@/types";
import CryptoCardCompact from "./ui/CryptoCardCompact";

export default function StatsCards({
  transactions,
  accountAddresses = [
    "0x0000000000000000000000000000000000000000",
  ] as Address[],
  tokens,
}: {
  transactions: Transaction[];
  accountAddresses?: Address[];
  tokens: Token[];
}) {
  const stats = useMemo(
    () => computeTokenStats(transactions, accountAddresses, tokens),
    [transactions, accountAddresses, tokens]
  );

  return (
    <div className="flex flex-wrap gap-0 sm:gap-2 w-full">
      {Object.entries(stats)
        .filter(
          ([, stats]) =>
            stats.stats.all.count > 0 &&
            (stats.stats.inbound.value > 0 || stats.stats.outbound.value > 0)
        )
        .map(([tokenAddress, stats]) => (
          <div
            className="w-1/2 sm:w-60 p-1 sm:p-0"
            key={`${stats.token.chain}:${tokenAddress}`}
          >
            <CryptoCardCompact
              className="w-48 sm:w-60"
              name={stats.token.chain}
              key={`${stats.token.chain}:${tokenAddress}`}
              symbol={stats.token.symbol}
              netAmount={stats.stats.all.net ?? 0}
              inbound={stats.stats.inbound.value}
              outbound={stats.stats.outbound.value}
              iconUrl={stats.token.imageUrl}
            />
          </div>
        ))}
    </div>
  );
}
