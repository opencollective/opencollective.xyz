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
  const ERC20Token = await ethers.getContractFactory("ERC20Token");

  // Interactive input for deployment parameters
  const name = await question("Enter token name: ");
  const symbol = await question("Enter token symbol: ");
  const decimals = await question("Enter token decimals: ");

  console.log("\nDeploying ERC20Token contract...");
  console.log("Parameters:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Decimals:", decimals);

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
  const tokenContract = await ERC20Token.deploy(
    name,
    symbol,
    decimals,
    deployer.address
  );

  // Wait for deployment to finish
  await tokenContract.waitForDeployment();

  // Get the deployed contract address
  const address = await tokenContract.getAddress();
  console.log("ERC20Token deployed to:", `${etherscanUrl}/address/${address}`);

  // Get the deployment transaction
  const deployTx = tokenContract.deploymentTransaction();
  const txHash = deployTx.hash;
  console.log("Transaction hash:", txHash);

  console.log("View transaction on Etherscan:", `${etherscanUrl}/tx/${txHash}`);

  // Wait for a few block confirmations before verifying
  console.log("Waiting for block confirmations...");
  await tokenContract.deploymentTransaction().wait(5);

  // Verify the contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [name, symbol, decimals, deployer.address],
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
