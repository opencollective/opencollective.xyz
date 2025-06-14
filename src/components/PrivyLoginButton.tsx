"use client";

import { usePrivy, useFundWallet, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatNumber } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { baseSepolia } from "viem/chains";

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

// ERC20 ABI for balanceOf
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export function PrivyLoginButton() {
  const { login, authenticated, user, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!authenticated || !user?.wallet?.address) return;

      try {
        const provider = await wallets[0].getEthereumProvider();
        const ethersProvider = new ethers.BrowserProvider(provider);
        const contract = new ethers.Contract(
          USDC_ADDRESS,
          ERC20_ABI,
          ethersProvider
        );
        const balance = await contract.balanceOf(user.wallet.address);
        setBalance(ethers.formatUnits(balance, USDC_DECIMALS));
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
      }
    };

    if (ready && authenticated) {
      fetchBalance();
    }
  }, [authenticated, user?.wallet?.address, ready, wallets]);

  const handleTopUp = () => {
    fundWallet(user?.wallet?.address || "", {
      amount: "1000000000000000000",
      chain: baseSepolia,
      asset: "USDC",
    });
  };

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src="https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png"
            alt="USDC"
            className="w-5 h-5"
          />
          <span className="text-sm font-medium">
            {formatNumber(Number(balance))} USDC
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTopUp}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Top Up
        </Button>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    );
  }

  return <Button onClick={login}>Login</Button>;
}
