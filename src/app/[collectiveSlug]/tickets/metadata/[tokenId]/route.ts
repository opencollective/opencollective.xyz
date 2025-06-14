import { NextRequest } from "next/server";
import { ethers, isAddress } from "ethers";
import MembershipCardsAbi from "@/artifacts/src/contracts/erc721.ticket.sol/MembershipCards.json";
import { getCollectiveConfig } from "@/lib/config";

const getMembershipCardData = async (
  contractAddress: string,
  tokenId: string
) => {
  if (!isAddress(contractAddress)) {
    throw new Error("getMembershipCardData: Invalid contract address");
  }

  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);

  const contract = new ethers.Contract(
    contractAddress,
    MembershipCardsAbi.abi,
    provider
  );

  try {
    const [ticketsLeft, expiry] = await contract.getCardData(tokenId);
    console.log(">>> getMembershipCardData", ticketsLeft, expiry);
    const expiryDate = Number(expiry);
    return {
      ticketsLeft: Number(ticketsLeft),
      ticketsTotal: 10,
      expiry: expiryDate,
    };
  } catch (error) {
    console.error(">>> getMembershipCardData", tokenId, error);
    return { error: (error as { reason: string }).reason };
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveSlug: string; tokenId: string }> }
) {
  const { collectiveSlug, tokenId } = await params;

  const collectiveConfig = await getCollectiveConfig(collectiveSlug);

  // Fetch daysLeft + expiry from your backend or via ethers.js contract call
  const passData = await getMembershipCardData(
    collectiveConfig?.membershipCardContractAddress || "",
    tokenId
  );

  if (passData.error) {
    return Response.json({ error: passData.error }, { status: 400 });
  }

  return Response.json({
    name: `Commons Hub 10-Day Pass #${tokenId}`,
    description: `10-day pass to the Commons Hub Brussels.`,
    image: `${process.env.WEBSITE_URL}/${collectiveSlug}/ticket.svg?ticketsLeft=${passData.ticketsLeft}&ticketsTotal=${passData.ticketsTotal}&expiryDate=${passData.expiry}`,
    attributes: [
      { trait_type: "Tickets", value: passData.ticketsTotal },
      {
        trait_type: "Remaining tickets",
        value: passData.ticketsLeft,
        max_value: passData.ticketsTotal,
      },
      {
        trait_type: "Expiry Date",
        value: passData.expiry,
        display_type: "date",
      },
    ],
  });
}
