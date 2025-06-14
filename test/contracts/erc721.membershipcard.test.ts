import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";

describe("MembershipCards", function () {
  let membershipContract: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  const name = "Commons Membership Card";
  const symbol = "CPASS";
  const baseURI = "https://api.example.com/passes";
  const defaultExpiryDuration = 365 * 24 * 60 * 60; // 1 year in seconds

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const MembershipCards = await ethers.getContractFactory("MembershipCards");
    membershipContract = await MembershipCards.deploy(
      name,
      symbol,
      baseURI,
      defaultExpiryDuration
    );
    await membershipContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await membershipContract.name()).to.equal(name);
      expect(await membershipContract.symbol()).to.equal(symbol);
    });

    it("Should set the correct default values", async function () {
      expect(await membershipContract.defaultExpiryDuration()).to.equal(
        BigInt(defaultExpiryDuration)
      );
      expect(await membershipContract.baseURI()).to.equal(baseURI);
    });
  });

  describe("Minting", function () {
    it("Should mint a new membership card to the specified address", async function () {
      await membershipContract.mint(user.address);
      expect(await membershipContract.ownerOf(1)).to.equal(user.address);
    });

    it("Should set the correct membership card data for minted token", async function () {
      await membershipContract.mint(user.address);
      const [mintedAt, expiryDate] =
        await membershipContract.getCardDataByTokenId(1);
      expect(Number(expiryDate)).to.be.gt(Math.floor(Date.now() / 1000));
    });

    it("Should increment nextTokenId after minting", async function () {
      await membershipContract.mint(user.address);
      expect(await membershipContract.nextTokenId()).to.equal(BigInt(2));
    });

    it("Should only allow admin to mint", async function () {
      await expect(
        membershipContract.connect(user).mint(user.address)
      ).to.be.revertedWithCustomError(
        membershipContract,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should not allow double minting for active membership", async function () {
      await membershipContract.mint(user.address);
      await expect(membershipContract.mint(user.address)).to.be.revertedWith(
        "Already has an active membership"
      );
    });

    it("Should allow minting after membership expires", async function () {
      await membershipContract.mint(user.address);
      // Fast forward time by 2 years
      await ethers.provider.send("evm_increaseTime", [2 * 365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Should be able to mint again
      await membershipContract.mint(user.address);
      expect(await membershipContract.ownerOf(2)).to.equal(user.address);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await membershipContract.mint(user.address);
    });

    it("Should burn the token", async function () {
      await membershipContract.burn(user.address);
      await expect(membershipContract.ownerOf(1)).to.be.revertedWithCustomError(
        membershipContract,
        "ERC721NonexistentToken"
      );
    });

    it("Should only allow admin to burn", async function () {
      await expect(
        membershipContract.connect(user).burn(user.address)
      ).to.be.revertedWithCustomError(
        membershipContract,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when burning non-existent token", async function () {
      await expect(
        membershipContract.burn(ethers.Wallet.createRandom().address)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Membership Card Data", function () {
    beforeEach(async function () {
      await membershipContract.mint(user.address);
    });

    it("Should return correct membership card data by token ID", async function () {
      const [mintedAt, expiryDate, owner] =
        await membershipContract.getCardDataByTokenId(1);
      expect(expiryDate).to.be.gt(Math.floor(Date.now() / 1000));
      expect(owner).to.equal(user.address);
    });

    it("Should return correct membership card data by address", async function () {
      const [mintedAt, expiryDate] =
        await membershipContract.getCardDataByAddress(user.address);
      expect(expiryDate).to.be.gt(Math.floor(Date.now() / 1000));
    });

    it("Should revert when getting data for non-existent token", async function () {
      await expect(
        membershipContract.getCardDataByTokenId(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Expiry Management", function () {
    beforeEach(async function () {
      await membershipContract.mint(user.address);
    });

    it("Should allow admin to update expiry date", async function () {
      const newExpiry = Math.floor(Date.now() / 1000) + 1000;
      await membershipContract.setExpiry(user.address, newExpiry);
      const [, expiry] = await membershipContract.getCardDataByAddress(
        user.address
      );
      expect(expiry).to.equal(BigInt(newExpiry));
    });

    it("Should only allow admin to update expiry date", async function () {
      await expect(
        membershipContract.connect(user).setExpiry(user.address, 0)
      ).to.be.revertedWithCustomError(
        membershipContract,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when updating expiry for non-member", async function () {
      await expect(
        membershipContract.setExpiry(ethers.Wallet.createRandom().address, 0)
      ).to.be.revertedWith("Address is not a member");
    });
  });

  describe("URI", function () {
    beforeEach(async function () {
      await membershipContract.mint(user.address);
    });

    it("Should return correct token URI", async function () {
      const uri = await membershipContract.tokenURI(1);
      expect(uri).to.equal(`${baseURI}/1`);
    });

    it("Should allow admin to update baseURI", async function () {
      const newBaseURI = "https://new-api.example.com/passes/";
      await membershipContract.setBaseURI(newBaseURI);
      expect(await membershipContract.baseURI()).to.equal(newBaseURI);
      expect(await membershipContract.tokenURI(1)).to.equal(`${newBaseURI}/1`);
    });

    it("Should only allow admin to update baseURI", async function () {
      await expect(
        membershipContract.connect(user).setBaseURI("new-uri")
      ).to.be.revertedWithCustomError(
        membershipContract,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when getting URI for non-existent token", async function () {
      await expect(membershipContract.tokenURI(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });
});
