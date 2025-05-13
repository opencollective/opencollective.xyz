"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from "lucide-react";
import CopyableValue from "./CopyableValue";
import { useNostr } from "@/providers/NostrProvider";

import EditMetadataForm from "@/components/EditMetadataForm";
import { getENSNameFromAddress } from "@/utils/crypto.server";
import { getAddressFromURI } from "@/lib/utils";
import type { URI, Address } from "@/types";
import TagsList from "./TagsList";
import TagValue from "./TagValue";
import Avatar from "./Avatar";

export default function AddressInfo({
  uri,
  ensName,
}: {
  uri: URI;
  ensName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notesByURI, subscribeToNotesByURI } = useNostr();
  subscribeToNotesByURI([uri]);
  const latestNote = notesByURI[uri as URI]?.[0];
  const [addressName, setAddressName] = useState(
    latestNote?.content || ensName || "Unknown address"
  );

  const address = getAddressFromURI(uri);

  useEffect(() => {
    const latestNote = notesByURI[uri as URI]?.[0];
    if (latestNote?.content) {
      setAddressName(latestNote.content);
      return;
    }
    const fetchENSName = async (address: Address) => {
      const ensName = await getENSNameFromAddress(address);
      console.log(">>> fetchENSName", address, ensName);
      setAddressName(ensName || "Unknown address");
    };
    if (!ensName) {
      const address = getAddressFromURI(uri);
      fetchENSName(address);
    }
  }, [uri, addressName, notesByURI, ensName]);

  const onCancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start">
          <Avatar uri={uri} className="w-24 h-24 mr-4 text-6xl" />
          <div className="flex flex-col">
            {isEditing ? (
              <div className="space-y-2">
                <EditMetadataForm
                  uri={uri}
                  content={latestNote?.content}
                  tags={latestNote?.tags}
                  inputRef={inputRef}
                  onCancel={onCancelEditing}
                />
              </div>
            ) : (
              <div className="group relative flex flex-row items-center">
                <span className="pr-2 text-2xl">{addressName}</span>

                <button
                  onClick={() => {
                    setIsEditing(true);

                    // Focus the input when entering edit mode
                    setTimeout(() => {
                      inputRef.current?.select();
                    }, 0);
                  }}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
            <p>
              <TagValue note={latestNote} kind="about" />
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <TagsList tags={latestNote?.tags} kinds={["t", "website"]} />
              <CopyableValue
                value={address}
                className="text-xs bg-transparent"
                truncate
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
