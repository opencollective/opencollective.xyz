import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Coins,
  ListChecks,
  ArrowDownLeft,
  ArrowUpRight,
  Sigma,
} from "lucide-react";
import { cn, computeTokenStats, formatTimestamp } from "@/lib/utils";
import { ethers } from "ethers";
import { truncateAddress } from "@/utils/crypto";
import { useMemo } from "react";
import { formatNumber } from "@/lib/utils";
import type { Transaction, Token, Address } from "@/types";
import CryptoCardCompact from "./ui/CryptoCardCompact";

interface TokenStats {
  received: number;
  spent: number;
  net: number;
  token: Token;
}

export default function StatsCards({
  transactions,
  accountAddresses = [
    "0x0000000000000000000000000000000000000000",
  ] as Address[],
  timeRangeLabel,
  tokens,
}: {
  transactions: Transaction[];
  accountAddresses?: Address[];
  timeRangeLabel: string;
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
          ([tokenAddress, stats]) =>
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
