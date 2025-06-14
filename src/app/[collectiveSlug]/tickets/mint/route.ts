// src/app/api/[collectiveSlug]/tickets/mint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { mint } from "@/lib/nft";

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

  try {
    const txHash = await mint(contractAddress, recipientAddress);
    return NextResponse.json({ success: true, txHash });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
