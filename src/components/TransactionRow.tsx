import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { Edit } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Separator } from "@/components/ui/separator";
import { useNostr } from "@/providers/NostrProvider";
import type {
  Transaction,
  Address,
  ProfileData,
  FiatCurrencySymbol,
} from "@/types";
import EditMetadataForm from "@/components/EditMetadataForm";
import TagsList from "./TagsList";

import { getCollectiveConfig, getWalletAddresses } from "@/lib/config";
import {
  formatNumber,
  formatTimestamp,
  generateURI,
  getChainSlugFromChainId,
  getFxRate,
} from "@/lib/utils";
interface TransactionRowProps {
  tx: Transaction;
  collectiveSlug: string;
}

export function TransactionRow({ tx, collectiveSlug }: TransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notesByURI, subscribeToNotesByURI } = useNostr();

  // Initialize edit values when notes change or edit mode is activated
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isEditing]);

  const fromURI = generateURI("ethereum", {
    chainId: tx.chainId,
    address:
      tx.from === "0x0000000000000000000000000000000000000000"
        ? tx.token.address
        : tx.from,
  });
  const toURI = generateURI("ethereum", {
    chainId: tx.chainId,
    address:
      tx.to === "0x0000000000000000000000000000000000000000"
        ? tx.token.address
        : tx.to,
  });

  const chain = getChainSlugFromChainId(tx.chainId);

  if (!tx) {
    console.error("TransactionRow: tx is undefined");
    return null;
  }

  const uri = generateURI("ethereum", {
    chainId: tx.chainId,
    txHash: tx.txHash,
  });
  subscribeToNotesByURI([uri]);
  const lastNote = notesByURI[uri] && notesByURI[uri][0];

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const collectiveConfig = getCollectiveConfig(collectiveSlug);
  const walletAddresses = getWalletAddresses(collectiveSlug);
  const getDefaultProfile = (address: Address) => {
    if (walletAddresses.includes(address)) {
      return {
        uri: fromURI,
        ...collectiveConfig?.profile,
      } as ProfileData;
    }
    return undefined;
  };

  const defaultFromProfile = getDefaultProfile(tx.from);
  const defaultToProfile = getDefaultProfile(tx.to);

  const fxrate = getFxRate(
    tx.token,
    collectiveConfig?.primaryCurrency as FiatCurrencySymbol,
    new Date(tx.timestamp * 1000)
  );

  return (
    <div className="space-y-4" key={tx.txHash}>
      {/* Main Transaction Info */}
      <div className="flex items-start gap-4 flex-row">
        {/* Avatars */}
        <div className="relative">
          <Avatar
            uri={fromURI}
            editable={true}
            defaultProfile={defaultFromProfile}
          />
          <Avatar
            uri={toURI}
            editable={true}
            defaultProfile={defaultToProfile}
            className="absolute -bottom-2 -right-2 h-8 w-8 border-2 border-gray-300 bg-white"
          />
        </div>

        {/* Description and Addresses */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <EditMetadataForm
                uri={uri}
                compact={true}
                inputRef={inputRef}
                onCancel={handleCancelEdit}
                content={lastNote.content}
                tags={lastNote.tags}
              />

              {/* Timestamp is always visible */}
              <div className="flex items-center text-sm">
                <Link
                  href={`https://txinfo.xyz/${chain}/tx/${tx.txHash}`}
                  title={formatTimestamp(
                    tx.timestamp,
                    "MMM d, yyyy 'at' HH:mm:ss zzz"
                  )}
                  className="text-muted-foreground hover:underline"
                >
                  {formatTimestamp(tx.timestamp)}
                </Link>
              </div>
            </div>
          ) : lastNote?.content ? (
            <div className="group relative flex flex-row items-center">
              <p className="mt-1 text-sm font-bold pr-2">{lastNote.content}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-4 w-4 mt-1 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : (
            <EditMetadataForm
              uri={uri}
              compact={true}
              inputRef={inputRef}
              onCancel={handleCancelEdit}
            />
          )}

          {/* Timestamp and Tags - Only show when not editing */}
          {!isEditing && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`https://txinfo.xyz/${chain}/tx/${tx.txHash}`}
                  title={formatTimestamp(
                    tx.timestamp,
                    "MMM d, yyyy 'at' HH:mm:ss zzz"
                  )}
                  className="text-muted-foreground hover:underline"
                >
                  {formatTimestamp(tx.timestamp)}
                </Link>
                <TagsList tags={lastNote?.tags} />
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-right">
          <div className="text-lg font-semibold">
            <span
              title={formatNumber(
                Number(ethers.formatUnits(tx.value, tx.token.decimals)),
                4,
                false
              )}
            >
              {formatNumber(
                Number(ethers.formatUnits(tx.value, tx.token.decimals))
              )}{" "}
            </span>

            <Link href={`/${chain}/token/${tx.token.address}`}>
              <span className="text-sm font-normal text-muted-foreground">
                {tx.token.symbol?.substring(0, 6)}
              </span>
            </Link>

            {/* Add USD equivalent for non-USD tokens */}
            {fxrate && fxrate !== 1 && (
              <div
                className="text-sm text-muted-foreground"
                title={`1 ${tx.token.symbol} ≈ ${fxrate.toFixed(
                  4
                )} on ${formatTimestamp(tx.timestamp, "MMM d, yyyy")}`}
              >
                ≈ $
                {formatNumber(
                  Number(ethers.formatUnits(tx.value, tx.token.decimals)) *
                    fxrate
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />
    </div>
  );
}
