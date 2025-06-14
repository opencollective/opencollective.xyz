import { NextRequest } from "next/server";
import { ethers, isAddress } from "ethers";
import MembershipCardsAbi from "@/artifacts/src/contracts/erc721.membershipcard.sol/MembershipCards.json";
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
    const [mintedAt, expiryDate, owner] = await contract.getCardDataByTokenId(
      tokenId
    );
    const name = await contract.name();
    return {
      name,
      mintedAt: Number(mintedAt),
      expiryDate: Number(expiryDate),
      owner,
    };
  } catch (error) {
    console.error(">>> getMembershipCardData", tokenId, error);
    const e = error as { reason: string; shortMessage: string };
    return { error: e.reason || e.shortMessage };
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveSlug: string; tokenId: string }> }
) {
  const { collectiveSlug, tokenId } = await params;

  const collectiveConfig = await getCollectiveConfig(collectiveSlug);

  // Fetch daysLeft + expiry from your backend or via ethers.js contract call
  const membershipData = await getMembershipCardData(
    collectiveConfig?.membershipCardContractAddress || "",
    tokenId
  );

  console.log(">>> membershipData", membershipData);
  if (membershipData.error) {
    return Response.json({ error: membershipData.error }, { status: 400 });
  }

  return Response.json({
    name: `Commons Hub 10-Day Pass #${tokenId}`,
    description: `10-day pass to the Commons Hub Brussels.`,
    image: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/${collectiveSlug}/membershipcard.svg?name=${membershipData.name}&mintedAt=${membershipData.mintedAt}&expiryDate=${membershipData.expiryDate}`,
    attributes: [
      {
        trait_type: "Member since",
        value: membershipData.mintedAt,
        display_type: "date",
      },
      {
        trait_type: "Expiry Date",
        value: membershipData.expiryDate,
        display_type: "date",
      },
    ],
  });
}
