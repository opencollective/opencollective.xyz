"use client";

import {
  cn,
  generateURI,
  getAddressFromURI,
  getLeaderboard,
  Leaderboard,
  LeaderboardEntry,
  formatAmount,
} from "@/lib/utils";
import { getProfileFromNotes, useNostr } from "@/providers/NostrProvider";
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
  limit = 11,
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
  size: "small" | "medium" | "large";
  limit?: number;
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

  const { subscribeToNotesByURI, notesByURI } = useNostr();

  const leaderboard: Leaderboard | null = useMemo(
    () => getLeaderboard(transactions, "USD", direction),
    [transactions, direction]
  );
  if (!leaderboard) {
    return <div>No leaderboard...</div>;
  }

  subscribeToNotesByURI(addressURIs);

  const profilesByURI = Object.fromEntries(
    Object.entries(notesByURI).map(([uri, note]) => [
      uri,
      getProfileFromNotes(uri as URI, note),
    ])
  );

  const leaderboardEntries = limit ? leaderboard.slice(0, limit) : leaderboard;

  return (
    <div className={className}>
      <div
        className={cn(
          "flex flex-wrap gap-1",
          size === "large" && "gap-4",
          size === "medium" && "gap-2"
        )}
      >
        {leaderboardEntries.map((entry: LeaderboardEntry) => {
          const uri = entry.uri;
          const address = getAddressFromURI(uri);
          return (
            <div key={uri} className="flex flex-col items-center text-center ">
              <Avatar
                uri={uri}
                title={`${
                  profilesByURI[entry.uri]?.name || ""
                }\n\nAddress: ${truncateAddress(address)}\n\nTransactions: ${
                  entry.stats.all.count
                }${
                  direction === "outbound"
                    ? `\nAmount: ${formatAmount(entry.stats.inbound.value)}` // for outbound transactions, we show the list of people who have received the tokens
                    : ""
                }${
                  direction === "inbound"
                    ? `\nAmount: ${formatAmount(entry.stats.outbound.value)}`
                    : ""
                }${
                  direction === "internal"
                    ? `\nInternal: ${entry.stats.internal.value}`
                    : ""
                }${
                  direction === "all" ? `\nAll: ${entry.stats.all.value}` : ""
                }`}
                editable={true}
                className={
                  size === "large"
                    ? "w-24 h-24"
                    : size === "medium"
                    ? "w-16 h-16"
                    : "w-8 h-8"
                }
                onClick={(uri: URI) =>
                  onClick && onClick({ uri, direction, tokenType })
                }
              />
            </div>
          );
        })}
        {limit && leaderboard.length > limit && (
          <div className="flex flex-col items-center text-center">
            <div
              className={`flex ml-1 items-center justify-center ${
                size === "large" ? "h-24" : size === "medium" ? "h-16" : "h-8"
              }`}
            >
              <span
                className={`${
                  size === "large"
                    ? "text-2xl"
                    : size === "medium"
                    ? "text-xl"
                    : "text-sm"
                } font-medium dark:text-white`}
              >
                +{leaderboard.length - limit}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
