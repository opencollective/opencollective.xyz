// src/app/api/[collectiveSlug]/tickets/mint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers, isAddress } from "ethers";
import MembershipCardsAbi from "@/artifacts/src/contracts/erc721.ticket.sol/MembershipCards.json";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  // const chain = searchParams.get("contractAddress")?.split(":")[0];
  const contractAddress = searchParams.get("contractAddress")?.split(":").pop();
  const recipientAddress = searchParams.get("recipientAddress");

  if (!contractAddress || !recipientAddress) {
    return NextResponse.json(
      { error: "Missing contractAddress or recipientAddress" },
      { status: 400 }
    );
  }

  if (!isAddress(contractAddress)) {
    return NextResponse.json(
      { error: "Invalid contract address" },
      { status: 400 }
    );
  }

  if (!isAddress(recipientAddress)) {
    return NextResponse.json(
      { error: "Invalid recipient address" },
      { status: 400 }
    );
  }

  // Set up provider and signer (owner)
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  // Connect to the contract
  const contract = new ethers.Contract(
    contractAddress,
    MembershipCardsAbi.abi,
    signer
  );

  try {
    const tx = await contract.mint(recipientAddress);
    await tx.wait();
    return NextResponse.json({ success: true, txHash: tx.hash });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
