import { ethers, isAddress } from "ethers";
import TokenAbi from "@/artifacts/src/contracts/erc20.token.sol/ERC20Token.json";

/**
 * Mint a token to a recipient address
 * @param tokenAddress - The address of the token contract
 * @param recipientAddress - The address of the recipient
 * @returns The transaction hash
 */
export async function mint(
  tokenAddress: string,
  recipientAddress: string,
  amount: bigint
) {
  console.log(
    ">>> minting token",
    tokenAddress,
    "to",
    recipientAddress,
    "amount",
    amount
  );
  if (!isAddress(tokenAddress)) {
    throw new Error("Invalid contract address");
  }

  if (!isAddress(recipientAddress)) {
    throw new Error("Invalid recipient address");
  }

  // Set up provider and signer (owner)
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  // Connect to the contract
  const contract = new ethers.Contract(tokenAddress, TokenAbi.abi, signer);

  const tx = await contract.mint(recipientAddress, amount);
  await tx.wait();
  return tx.hash;
}
