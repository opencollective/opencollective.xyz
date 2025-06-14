"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MintNFTProps {
  checkout_session_id: string;
  preview_url: string;
  className?: string;
}

export default function MintNFT({
  checkout_session_id,
  preview_url,
}: MintNFTProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  useEffect(() => {
    setIsMinting(true);
    const mintNFT = async () => {
      try {
        const response = await fetch(`/api/stripe/mint`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stripeSessionId: checkout_session_id }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to mint NFT");
        }

        toast.success("NFT minted successfully!");
      } catch (error) {
        console.error("Error minting NFT:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to mint NFT"
        );
      } finally {
        setIsMinting(false);
        setResponse("Minted!");
      }
    };
    mintNFT();
  }, [checkout_session_id]);

  return (
    <div>
      <img src={preview_url} alt="NFT preview" />
      {isMinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Minting...
        </>
      ) : (
        response
      )}
    </div>
  );
}
