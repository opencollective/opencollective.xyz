import { ethers, isAddress } from "ethers";
import MembershipCardsAbi from "@/artifacts/src/contracts/erc721.membershipcard.sol/MembershipCards.json";

/**
 * Mint an NFT to a recipient address
 * @param nftAddress - The address of the NFT contract
 * @param recipientAddress - The address of the recipient
 * @returns The transaction hash
 */
export async function mint(nftAddress: string, recipientAddress: string) {
  console.log(">>> minting nft", nftAddress, "to", recipientAddress);
  if (!isAddress(nftAddress)) {
    throw new Error("Invalid contract address");
  }

  if (!isAddress(recipientAddress)) {
    throw new Error("Invalid recipient address");
  }

  // Set up provider and signer (owner)
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  // Connect to the contract
  const contract = new ethers.Contract(
    nftAddress,
    MembershipCardsAbi.abi,
    signer
  );

  const tx = await contract.mint(recipientAddress);
  await tx.wait();
  return tx.hash;
}
