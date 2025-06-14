const { ethers } = require("hardhat");
const hre = require("hardhat");
const readline = require("readline");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promise wrapper for readline
const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  // Get the deployer's wallet
  const [deployer] = await ethers.getSigners();
  console.log("Deployer's public key:", deployer.address);

  // Get the contract factory
  const MembershipCards = await ethers.getContractFactory("MembershipCards");

  // Interactive input for deployment parameters
  const collectiveSlug = await question("Enter collective slug: ");
  const name = await question("Enter token name: ");
  const symbol = await question("Enter token symbol: ");
  const expiration = await question(
    "When does the membership expire? (in months): "
  );
  const defaultExpiryDuration = parseInt(expiration) * 30 * 24 * 60 * 60; // in seconds
  const baseURI = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/${collectiveSlug}/tickets/metadata`;

  console.log("\nDeploying MembershipCards contract...");
  console.log("Parameters:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Base URI:", baseURI);
  console.log("- Default Expiry Duration:", defaultExpiryDuration, "seconds");

  const confirm = await question("Are you sure you want to deploy? (y/n): ");
  if (confirm !== "y") {
    console.log("Deployment cancelled.");
    rl.close();
    return;
  }

  // Get the network to determine the Etherscan URL
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  let etherscanUrl;

  switch (chainId) {
    case 1: // Mainnet
      etherscanUrl = `https://etherscan.io`;
      break;
    case 5: // Goerli
      etherscanUrl = `https://goerli.etherscan.io`;
      break;
    case 84532: // BASE Sepolia
      etherscanUrl = `https://sepolia.basescan.org`;
      break;
    default:
      etherscanUrl = `https://etherscan.io`;
  }

  // Deploy the contract
  const ticketCardsContract = await MembershipCards.deploy(
    name,
    symbol,
    baseURI,
    defaultExpiryDuration
  );

  // Wait for deployment to finish
  await ticketCardsContract.waitForDeployment();

  // Get the deployed contract address
  const address = await ticketCardsContract.getAddress();
  console.log(
    "MembershipCards deployed to:",
    `${etherscanUrl}/address/${address}`
  );

  // Get the deployment transaction
  const deployTx = ticketCardsContract.deploymentTransaction();
  const txHash = deployTx.hash;
  console.log("Transaction hash:", txHash);

  console.log("View transaction on Etherscan:", `${etherscanUrl}/tx/${txHash}`);

  // Wait for a few block confirmations before verifying
  console.log("Waiting for block confirmations...");
  await ticketCardsContract.deploymentTransaction().wait(5);

  // Verify the contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [name, symbol, baseURI, defaultExpiryDuration],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }

  // Close the readline interface
  rl.close();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  rl.close();
});
