"use client";

import {
  generateURI,
  getAddressFromURI,
  getLeaderboard,
  Leaderboard,
  LeaderboardEntry,
} from "@/lib/utils";
import { useNostr } from "@/providers/NostrProvider";
import { TokenType, Transaction, TransactionDirection, URI } from "@/types";
import Avatar from "./Avatar";
import { useMemo } from "react";
import { truncateAddress } from "@/utils/crypto.server";

export default function LeaderboardComponent({
  onClick,
  transactions,
  direction,
  tokenType,
  size,
  className,
}: {
  onClick?: ({
    uri,
    direction,
    tokenType,
  }: {
    uri: URI;
    direction: TransactionDirection;
    tokenType: TokenType;
  }) => void;
  transactions: Transaction[];
  direction: TransactionDirection;
  tokenType: TokenType;
  size: "small" | "large";
  className?: string;
}) {
  const addressURIs: URI[] = [];
  transactions.map((tx) => {
    addressURIs.push(
      generateURI("ethereum", {
        chainId: tx.chainId,
        address: tx.from,
      })
    );
    addressURIs.push(
      generateURI("ethereum", {
        chainId: tx.chainId,
        address: tx.to,
      })
    );
  });

  const { subscribeToNotesByURI } = useNostr();

  const leaderboard: Leaderboard | null = useMemo(
    () => getLeaderboard(transactions, "USD", direction, tokenType),
    [transactions, direction, tokenType]
  );
  if (!leaderboard) {
    return <div>No leaderboard...</div>;
  }

  subscribeToNotesByURI(addressURIs);

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1">
        {leaderboard.map((entry: LeaderboardEntry) => {
          const uri = entry.uri;
          const address = getAddressFromURI(uri);
          return (
            <div key={uri} className="flex flex-col items-center text-center">
              <Avatar
                uri={uri}
                title={`Address: ${truncateAddress(address)}\n\nTransactions: ${
                  entry.stats.all.count
                }${
                  direction === "outbound"
                    ? `\nInbound: ${entry.stats.inbound.value}` // for outbound transactions, we show the list of people who have received the tokens
                    : ""
                }${
                  direction === "inbound"
                    ? `\nOutbound: ${entry.stats.outbound.value}`
                    : ""
                }${
                  direction === "internal"
                    ? `\nInternal: ${entry.stats.internal.value}`
                    : ""
                }${
                  direction === "all" ? `\nAll: ${entry.stats.all.value}` : ""
                }`}
                editable={false}
                className={size === "large" ? "w-24 h-24" : "w-8 h-8"}
                onClick={(uri: URI) =>
                  onClick && onClick({ uri, direction, tokenType })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
