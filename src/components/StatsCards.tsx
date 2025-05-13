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
    <div className="flex flex-wrap gap-4">
      {Object.entries(stats)
        .filter(
          ([, stats]) =>
            stats.txCount > 0 &&
            (stats.inbound.value > 0 || stats.outbound.value > 0)
        )
        .map(([tokenAddress, stats]) => (
          <CryptoCardCompact
            className="w-60"
            name={stats.token.chain}
            key={`${stats.token.chain}:${tokenAddress}`}
            symbol={stats.token.symbol}
            netAmount={stats.netValue}
            inbound={stats.inbound.value}
            outbound={stats.outbound.value}
            iconUrl={stats.token.imageUrl}
          />
        ))}
    </div>
  );
}
