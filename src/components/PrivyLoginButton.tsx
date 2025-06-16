"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatNumber } from "@/lib/utils";
import { CollectiveConfig } from "@/types";

// ERC20 ABI for balanceOf
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export function PrivyLoginButton({
  collectiveConfig,
}: {
  collectiveConfig: CollectiveConfig;
}) {
  const { login, authenticated, user, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!authenticated || !user?.wallet?.address) return;
      if (wallets.length === 0) return;
      console.log(">>> wallets", wallets);

      try {
        const ethersProvider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_CELO_RPC_URL
        );
        if (!collectiveConfig.tokens) return;
        const contract = new ethers.Contract(
          collectiveConfig.tokens[0].address,
          ERC20_ABI,
          ethersProvider
        );
        const balance = await contract.balanceOf(user.wallet.address);
        setBalance(
          ethers.formatUnits(balance, collectiveConfig.tokens[0].decimals)
        );
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
      }
    };

    if (ready && authenticated && collectiveConfig.tokens) {
      fetchBalance();
    }
  }, [
    authenticated,
    user?.wallet?.address,
    ready,
    wallets,
    collectiveConfig.tokens,
  ]);

  if (authenticated && collectiveConfig.tokens) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src={collectiveConfig.tokens[0].imageUrl}
            alt={collectiveConfig.tokens[0].symbol}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium">
            {formatNumber(Number(balance))} {collectiveConfig.tokens[0].symbol}
          </span>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    );
  }

  return <Button onClick={login}>Login</Button>;
}
