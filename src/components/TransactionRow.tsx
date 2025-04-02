"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import chains from "@/chains.json";
import { Loader2, Edit, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNostr } from "@/providers/NostrProvider";
import type { Transaction, Address, TxHash } from "@/types";
import EditMetadataForm from "@/components/EditMetadataForm";
import TagsList from "./TagsList";
import { formatNumber, formatTimestamp, generateURI } from "@/lib/utils";

type Chain = { id: number };
type Chains = Record<string, Chain>;

interface TransactionRowProps {
  tx: Transaction;
}

interface ProfileData {
  address: Address | undefined;
  name: string;
  about: string;
  picture: string;
  website: string;
}

export function TransactionRow({ tx }: TransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { publishMetadata, notesByURI } = useNostr();

  // Profile editing states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<
    Address | TxHash | undefined
  >();
  const [profileData, setProfileData] = useState<ProfileData>({
    address: undefined,
    name: "",
    about: "",
    picture: "",
    website: "",
  });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const chain = Object.entries(chains as Chains).find(
    ([_, value]) => value.id === tx.chainId
  );

  // Initialize edit values when notes change or edit mode is activated
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isEditing]);

  if (!tx) {
    console.error("TransactionRow: tx is undefined");
    return null;
  }

  const uri = generateURI("ethereum", {
    chainId: tx.chainId,
    txHash: tx.txHash,
  });
  const lastNote = notesByURI[uri] && notesByURI[uri][0];

  const getDicebearUrl = (address: string) => {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const openProfileModal = (profile: ProfileData) => {
    setCurrentAddress(profile.address as Address);
    setProfileData(profile);
    setProfileModalOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAddress) return;

    setIsSubmittingProfile(true);

    try {
      const uri = generateURI("ethereum", {
        chainId: tx.chainId,
        address: currentAddress,
      });
      const previousNote = notesByURI[uri] ? notesByURI[uri][0] : null;
      // Here you would publish the profile data to nostr
      // This is a placeholder for the actual implementation
      await publishMetadata(uri, {
        content: profileData.name,
        tags: [
          // Make sure we don't duplicate tags
          ...(previousNote?.tags || []).filter(
            (t) => ["i", "picture", "website", "about"].indexOf(t[0]) === -1
          ),
          ["picture", profileData.picture],
          ["about", profileData.about],
          ["website", profileData.website],
        ],
      });

      setProfileModalOpen(false);
      // You might want to refresh the UI or notify the user of success
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const getProfileForAddress = (address: Address): ProfileData => {
    const defaultProfile = {
      address: address || undefined,
      name: "",
      about: "",
      picture: "",
      website: "",
    };
    if (!address) return defaultProfile;
    const uri = generateURI("ethereum", { chainId: tx.chainId, address });
    if (!notesByURI[uri]) return defaultProfile;
    const profileNote = notesByURI[uri][0];
    if (profileNote) {
      return {
        address: address,
        name: profileNote.content || "",
        about: profileNote.tags.find((t) => t[0] === "about")?.[1] || "",
        picture: profileNote.tags.find((t) => t[0] === "picture")?.[1] || "",
        website: profileNote.tags.find((t) => t[0] === "website")?.[1] || "",
      };
    }
    return defaultProfile;
  };

  const fromProfile = getProfileForAddress(
    tx.from === "0x0000000000000000000000000000000000000000"
      ? tx.token.address
      : tx.from
  );
  const toProfile = getProfileForAddress(
    tx.to === "0x0000000000000000000000000000000000000000"
      ? tx.token.address
      : tx.to
  );

  return (
    <div className="space-y-4" key={tx.txHash}>
      {/* Main Transaction Info */}
      <div className="flex items-start gap-4 flex-row">
        {/* Avatars */}
        <div className="relative">
          <Avatar
            title={fromProfile?.name || fromProfile?.address}
            className="h-12 w-12 border-2 border-gray-300 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => openProfileModal(fromProfile)}
          >
            <AvatarImage
              src={
                fromProfile?.picture ||
                getDicebearUrl(fromProfile?.address as string)
              }
              alt={fromProfile?.address}
            />
            <AvatarFallback>{fromProfile?.address?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <Avatar
            title={toProfile?.name || toProfile?.address}
            className="absolute -bottom-2 -right-2 h-8 w-8 border-2 border-background border-gray-300 bg-white cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => openProfileModal(toProfile)}
          >
            <AvatarImage
              src={
                toProfile?.picture ||
                getDicebearUrl(toProfile?.address as string)
              }
              alt={toProfile?.address}
            />
            <AvatarFallback>
              {toProfile?.address?.slice(0, 2) || "CT"}
            </AvatarFallback>
          </Avatar>
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
                  href={`/${chain}/tx/${tx.txHash}`}
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
                  href={`/${chain}/tx/${tx.txHash}`}
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
                2,
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
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile Edit Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              <Link
                href={`/${chain}/address/${currentAddress}`}
                title="View address on TxInfo"
              >
                {currentAddress}
              </Link>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="name" className="sm:text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  defaultValue={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="sm:col-span-3"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="picture" className="sm:text-right">
                  Website
                </Label>
                <Input
                  id="website"
                  defaultValue={profileData.website}
                  onChange={(e) =>
                    setProfileData({ ...profileData, website: e.target.value })
                  }
                  className="sm:col-span-3"
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="picture" className="sm:text-right">
                  Picture URL
                </Label>
                <Input
                  id="picture"
                  defaultValue={profileData.picture}
                  onChange={(e) =>
                    setProfileData({ ...profileData, picture: e.target.value })
                  }
                  className="sm:col-span-3"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="about" className="sm:text-right">
                  About
                </Label>
                <Textarea
                  id="about"
                  defaultValue={profileData.about}
                  onChange={(e) =>
                    setProfileData({ ...profileData, about: e.target.value })
                  }
                  className="sm:col-span-3"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <div className="flex flex-col sm:flex-row-reverse gap-2">
                <Button type="submit" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProfileModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
