"use client";

import {
  filterTransactions,
  formatNumber,
  getTotalsByTokenType,
} from "@/lib/utils";
import {
  Transaction,
  CollectiveConfig,
  URI,
  TransactionDirection,
  TokenType,
  FiatCurrencySymbol,
} from "@/types";
import { useMemo } from "react";
import Leaderboard from "./Leaderboard";
import { getWalletAddresses } from "@/lib/config";

const getShortSymbol = (symbol: string) => {
  if (symbol === "USD") {
    return "$";
  }
  if (symbol === "EUR") {
    return "€";
  }
  if (symbol.length > 3) {
    return symbol.substring(0, 3);
  }
  return symbol;
};

const Separator = () => <div className="w-[1px] shrink-0 bg-gray-700" />;

export default function SideSummary({
  transactions,
  collectiveConfig,
  onClick,
}: {
  transactions: Transaction[];
  collectiveConfig: CollectiveConfig;
  onClick?: ({
    uri,
    direction,
    tokenType,
  }: {
    uri: URI;
    direction: TransactionDirection;
    tokenType: TokenType;
  }) => void;
}) {
  const totals = useMemo(
    () =>
      getTotalsByTokenType(
        transactions,
        collectiveConfig.wallets,
        collectiveConfig.primaryCurrency as FiatCurrencySymbol
      ),
    [transactions, collectiveConfig.wallets, collectiveConfig.primaryCurrency]
  );
  console.log(">>> totals", totals);
  if (!totals || (!totals["fiat"] && !totals["token"])) {
    return null;
  }

  const walletAddresses = getWalletAddresses(collectiveConfig.slug);

  return (
    <div className="space-y-8">
      <div className="flex sm:flex-col space-y-4">
        {/* Money In */}
        {totals.fiat && (
          <div className="flex flex-row items-stretch gap-2 w-1/2 sm:w-full">
            <Separator />
            <div>
              <h2 className="text-lg font-light mt-0 mb-2 ml-0">Money In</h2>
              <p className="text-xl font-light text-green-400">
                + {getShortSymbol(collectiveConfig.primaryCurrency)}
                {formatNumber(totals["fiat"].inbound)}
              </p>
              <Leaderboard
                tokenType="fiat"
                direction="inbound"
                size="small"
                transactions={filterTransactions(
                  transactions,
                  "fiat",
                  "inbound",
                  walletAddresses
                )}
                onClick={onClick}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Money Out */}
        {totals.fiat && (
          <div className="flex flex-row items-stretch gap-2">
            <Separator />
            <div>
              <h2 className="text-lg font-light mt-0 mb-2 ml-0">Money Out</h2>
              <p className="text-xl font-light text-pink-400">
                - {getShortSymbol(collectiveConfig.primaryCurrency)}
                {formatNumber(totals["fiat"].outbound)}
              </p>
              <Leaderboard
                tokenType="fiat"
                direction="outbound"
                size="small"
                transactions={filterTransactions(
                  transactions,
                  "fiat",
                  "outbound",
                  walletAddresses
                )}
                onClick={onClick}
                className="mt-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tokens Issued */}
      <div className="flex sm:flex-col space-y-4">
        {totals.token && (
          <div className="flex flex-row items-stretch gap-2 w-1/2 sm:w-full">
            <Separator />
            <div>
              <h2 className="text-lg font-light mt-0 mb-2 ml-0">
                Tokens Issued
              </h2>
              <p className="text-xl font-light">
                {formatNumber(totals["token"].outbound)}
              </p>
              <Leaderboard
                tokenType="token"
                direction="outbound" /* issued tokens */
                size="small"
                transactions={filterTransactions(
                  transactions,
                  "token",
                  "outbound",
                  walletAddresses
                )}
                onClick={onClick}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Tokens Redeemed */}
        {totals.token && (
          <div className="flex flex-row items-stretch gap-2">
            <Separator />
            <div>
              <h2 className="text-lg font-light mt-0 mb-2 ml-0">
                Tokens Redeemed
              </h2>
              <p className="text-xl font-light">
                {formatNumber(totals["token"].inbound)}
              </p>
              <Leaderboard
                tokenType="token"
                direction="inbound" /* redeemed tokens */
                size="small"
                transactions={filterTransactions(
                  transactions,
                  "token",
                  "inbound",
                  walletAddresses
                )}
                onClick={onClick}
                className="mt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
