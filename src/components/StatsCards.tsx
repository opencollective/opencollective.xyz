import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Coins,
  ListChecks,
  ArrowDownLeft,
  ArrowUpRight,
  Sigma,
} from "lucide-react";
import { cn, formatTimestamp } from "@/lib/utils";
import { ethers } from "ethers";
import { truncateAddress } from "@/utils/crypto";
import { useMemo } from "react";
import { formatNumber } from "@/lib/utils";
import type { Transaction, Token, Address } from "@/types";

export default function StatsCards({
  transactions,
  accountAddress = "0x0000000000000000000000000000000000000000" as Address,
  timeRangeLabel,
  tokens,
}: {
  transactions: Transaction[];
  accountAddress: Address;
  timeRangeLabel: string;
  tokens: Token[];
}) {
  const stats = useMemo(() => {
    const received = transactions
      .filter((tx) => tx.to.toLowerCase() === accountAddress.toLowerCase())
      .reduce(
        (acc, tx) =>
          acc + Number(ethers.formatUnits(tx.value, tx.token.decimals)),
        0
      );

    const spent = transactions
      .filter((tx) => tx.from.toLowerCase() === accountAddress.toLowerCase())
      .reduce(
        (acc, tx) =>
          acc + Number(ethers.formatUnits(tx.value, tx.token.decimals)),
        0
      );

    return {
      count: transactions.length,
      received: received,
      spent: spent,
      net: received - spent,
    };
  }, [transactions, accountAddress]);

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.count, 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {timeRangeLabel === "All Time"
              ? `since ${formatTimestamp(
                  transactions[transactions.length - 1]?.timestamp,
                  "MMM d, yyyy"
                )}`
              : `in ${timeRangeLabel.toLowerCase()}`}
          </p>
        </CardContent>
      </Card>

      {tokens.length === 1 ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(stats.received, 2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {tokens[0].symbol?.substring(0, 6)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {timeRangeLabel === "All Time"
                  ? `since ${formatTimestamp(
                      transactions[transactions.length - 1].timestamp,
                      "MMM yyyy"
                    )}`
                  : `in ${timeRangeLabel.toLowerCase()}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spent</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(stats.spent, 2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {tokens[0].symbol?.substring(0, 6)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {timeRangeLabel === "All Time"
                  ? `since ${formatTimestamp(
                      transactions[transactions.length - 1].timestamp,
                      "MMM yyyy"
                    )}`
                  : `in ${timeRangeLabel.toLowerCase()}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {timeRangeLabel.toLowerCase() === "all time"
                  ? "Balance"
                  : "Net Change"}
              </CardTitle>
              <Sigma
                className={cn(
                  "h-4 w-4",
                  stats.net > 0
                    ? "text-green-500"
                    : stats.net < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                )}
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  stats.net > 0
                    ? "text-green-500"
                    : stats.net < 0
                    ? "text-red-500"
                    : "text-foreground"
                )}
              >
                {stats.net > 0 ? "+" : ""}
                {formatNumber(stats.net, 2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {tokens[0].symbol?.substring(0, 6)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                in {timeRangeLabel.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        // Group transactions by token and show stats for each
        Object.entries(
          transactions.reduce((acc, tx) => {
            const tokenKey = tx.token.address;
            if (!tokens.find((t) => t.address === tokenKey)) {
              return acc;
            }
            if (!acc[tokenKey]) {
              acc[tokenKey] = {
                received: 0,
                spent: 0,
                net: 0,
                token: tx.token,
              };
            }
            const amount = Number(
              ethers.formatUnits(tx.value, tx.token.decimals)
            );
            if (tx.to.toLowerCase() === accountAddress.toLowerCase()) {
              acc[tokenKey].received += amount;
              acc[tokenKey].net += amount;
            } else {
              acc[tokenKey].spent += amount;
              acc[tokenKey].net -= amount;
            }
            return acc;
          }, {} as Record<string, { received: number; spent: number; net: number; token: Token }>)
        ).map(([token, stats]) => (
          <Card key={token} className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-sm font-medium">
                {stats.token?.symbol && stats.token?.symbol?.length > 6 ? (
                  <span title={stats.token.symbol}>
                    {stats.token.symbol?.substring(0, 6)}...
                  </span>
                ) : (
                  stats.token.symbol
                )}
                <div title={stats.token.address}>
                  {truncateAddress(stats.token.address)}
                </div>
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-center mb-4">
                <p
                  className={cn(
                    "text-2xl font-bold",
                    stats.net > 0
                      ? "text-green-500"
                      : stats.net < 0
                      ? "text-red-500"
                      : "text-foreground"
                  )}
                >
                  {stats.net > 0 ? "+" : ""}
                  {formatNumber(stats.net, 2).replace("-0", "0")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center border-t pt-3">
                <p className="text-sm font-medium text-green-500">
                  +{formatNumber(stats.received, 0)}
                </p>
                <p className="text-sm font-medium text-red-500">
                  -{formatNumber(stats.spent, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
