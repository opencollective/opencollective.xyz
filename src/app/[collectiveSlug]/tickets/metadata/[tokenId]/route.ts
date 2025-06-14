import { NextRequest } from "next/server";
import { ethers, isAddress } from "ethers";
import TicketCardsAbi from "@/artifacts/src/contracts/erc721.ticket.sol/TicketCards.json";
import { getCollectiveConfig } from "@/lib/config";

const getTicketCardData = async (contractAddress: string, tokenId: string) => {
  if (!isAddress(contractAddress)) {
    throw new Error("getTicketCardData: Invalid contract address");
  }

  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);

  const contract = new ethers.Contract(
    contractAddress,
    TicketCardsAbi.abi,
    provider
  );

  try {
    const [ticketsLeft, expiry] = await contract.getTicketCardData(tokenId);
    console.log(">>> getTicketCardData", ticketsLeft, expiry);
    return {
      ticketsLeft,
      ticketsTotal: 10,
      expiry,
    };
  } catch (error) {
    console.error(">>> getTicketCardData", tokenId, error);
  }

  return {
    ticketsLeft: 7,
    ticketsTotal: 10,
    expiry: "2026-06-13",
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveSlug: string; tokenId: string }> }
) {
  const { collectiveSlug, tokenId } = await params;

  const collectiveConfig = await getCollectiveConfig(collectiveSlug);

  // Fetch daysLeft + expiry from your backend or via ethers.js contract call
  const passData = await getTicketCardData(
    collectiveConfig?.ticketContractAddress || "",
    tokenId
  );

  return Response.json({
    name: `Commons Hub 10-Day Pass #${tokenId}`,
    description: `Pass with 10 entries.`,
    image: `${process.env.WEBSITE_URL}/${collectiveSlug}/ticket.svg?ticketsLeft=${passData.ticketsLeft}&ticketsTotal=${passData.ticketsTotal}&expiryDate=${passData.expiry}`,
    attributes: [
      { trait_type: "Tickets", value: passData.ticketsTotal },
      { trait_type: "Tickets left", value: passData.ticketsLeft },
      { trait_type: "Expiry Date", value: passData.expiry },
    ],
  });
}
