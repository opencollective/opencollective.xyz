import { filterTransactions, formatNumber, getTokenTotals } from "@/lib/utils";
import {
  Transaction,
  CollectiveConfig,
  URI,
  TransactionDirection,
  TokenType,
} from "@/types";
import { useMemo } from "react";
import Leaderboard from "./Leaderboard";

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

export default function SideSummary({
  transactions,
  collectiveConfig,
  onClick,
}: {
  transactions: Transaction[];
  collectiveConfig: CollectiveConfig;
  onClick: ({
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
    () => getTokenTotals(transactions, collectiveConfig.wallets),
    [transactions, collectiveConfig.wallets]
  );
  console.log(">>> totals", totals);
  if (!totals || (!totals["fiat"] && !totals["token"])) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Money In */}
      {totals.fiat && (
        <div className="flex items-start">
          <div className="w-0.5 h-20 bg-gray-700 mr-3"></div>
          <div>
            <h2 className="text-lg font-light mt-2 mb-2 ml-0">Money In</h2>
            <p className="text-xl font-light text-green-400">
              + {getShortSymbol(collectiveConfig.primaryCurrency)}
              {formatNumber(totals["fiat"].totalIn)}
            </p>
            <Leaderboard
              tokenType="fiat"
              direction="inbound"
              transactions={filterTransactions(
                transactions,
                "fiat",
                "inbound",
                collectiveConfig.wallets
              )}
              onClick={onClick}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Money Out */}
      {totals.fiat && (
        <div className="flex items-start">
          <div className="w-0.5 h-20 bg-gray-700 mr-3"></div>
          <div>
            <h2 className="text-lg font-light mt-2 mb-2 ml-0">Money Out</h2>
            <p className="text-xl font-light text-pink-400">
              - {getShortSymbol(collectiveConfig.primaryCurrency)}
              {formatNumber(totals["fiat"].totalOut)}
            </p>
            <Leaderboard
              tokenType="fiat"
              direction="outbound"
              transactions={filterTransactions(
                transactions,
                "fiat",
                "outbound",
                collectiveConfig.wallets
              )}
              onClick={onClick}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Tokens Issued */}
      {totals.token && (
        <div className="flex items-start">
          <div className="w-0.5 h-20 bg-gray-700 mr-3"></div>
          <div>
            <h2 className="text-lg font-light mt-2 mb-2 ml-0">Tokens Issued</h2>
            <p className="text-xl font-light">
              {formatNumber(totals["token"].totalOut)}
            </p>
            <Leaderboard
              tokenType="token"
              direction="outbound"
              transactions={filterTransactions(
                transactions,
                "token",
                "outbound",
                collectiveConfig.wallets
              )}
              onClick={onClick}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Tokens Redeemed */}
      {totals.token && (
        <div className="flex items-start">
          <div className="w-0.5 h-20 bg-gray-700 mr-3"></div>
          <div>
            <h2 className="text-lg font-light mt-2 mb-2 ml-0">
              Tokens Redeemed
            </h2>
            <p className="text-xl font-light">
              {formatNumber(totals["token"].totalIn)}
            </p>
            <Leaderboard
              tokenType="token"
              direction="inbound"
              transactions={filterTransactions(
                transactions,
                "token",
                "inbound",
                collectiveConfig.wallets
              )}
              onClick={onClick}
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}
