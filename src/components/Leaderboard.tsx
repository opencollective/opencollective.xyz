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
  className,
}: {
  onClick: ({
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
      <div>
        <div className="flex flex-wrap gap-1">
          {leaderboard.map((entry: LeaderboardEntry) => {
            const uri = entry.uri;
            const address = getAddressFromURI(uri);
            return (
              <div key={uri} className="flex flex-col items-center text-center">
                <Avatar
                  uri={uri}
                  title={`Address: ${truncateAddress(
                    address
                  )}\n\nTransactions: ${entry.txCount}${
                    direction === "inbound"
                      ? `\nInbound: ${entry.txVolume.inbound}`
                      : ""
                  }${
                    direction === "outbound"
                      ? `\nOutbound: ${entry.txVolume.outbound}`
                      : ""
                  }${
                    direction === "internal"
                      ? `\nInternal: ${entry.txVolume.internal}`
                      : ""
                  }${
                    direction === "all" ? `\nAll: ${entry.txVolume.all}` : ""
                  }`}
                  editable={false}
                  className="w-8 h-8"
                  onClick={(uri: URI) => onClick({ uri, direction, tokenType })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
