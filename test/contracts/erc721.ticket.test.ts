import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";

describe("TicketCards", function () {
  let ticketContract: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  const name = "Commons Pass";
  const symbol = "CPASS";
  const baseURI = "https://api.example.com/passes";
  const defaultTickets = 3;
  const defaultExpiryDuration = 365 * 24 * 60 * 60; // 1 year in seconds

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const TicketCards = await ethers.getContractFactory("TicketCards");
    ticketContract = await TicketCards.deploy(
      name,
      symbol,
      baseURI,
      defaultTickets,
      defaultExpiryDuration
    );
    await ticketContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ticketContract.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await ticketContract.name()).to.equal(name);
      expect(await ticketContract.symbol()).to.equal(symbol);
    });

    it("Should set the correct default values", async function () {
      expect(await ticketContract.defaultTickets()).to.equal(
        BigInt(defaultTickets)
      );
      expect(await ticketContract.defaultExpiryDuration()).to.equal(
        BigInt(defaultExpiryDuration)
      );
      expect(await ticketContract.baseURI()).to.equal(baseURI);
    });
  });

  describe("Minting", function () {
    it("Should mint a new pass to the specified address", async function () {
      await ticketContract.mint(user.address);
      expect(await ticketContract.ownerOf(1)).to.equal(user.address);
    });

    it("Should set the correct pass data for minted token", async function () {
      await ticketContract.mint(user.address);
      const [ticketsLeft, expiry] = await ticketContract.getTicketCardData(1);
      expect(Number(ticketsLeft)).to.equal(defaultTickets);
      expect(Number(expiry)).to.be.gt(Math.floor(Date.now() / 1000));
    });

    it("Should increment nextTokenId after minting", async function () {
      await ticketContract.mint(user.address);
      expect(await ticketContract.nextTokenId()).to.equal(BigInt(2));
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        ticketContract.connect(user).mint(user.address)
      ).to.be.revertedWithCustomError(
        ticketContract,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Using Tickets", function () {
    beforeEach(async function () {
      await ticketContract.mint(user.address);
    });

    it("Should decrease tickets left when using a ticket", async function () {
      await ticketContract.useTicket(1);
      const [ticketsLeft] = await ticketContract.getTicketCardData(1);
      expect(ticketsLeft).to.equal(defaultTickets - 1);
    });

    it("Should not allow using tickets when none are left", async function () {
      for (let i = 0; i < defaultTickets; i++) {
        await ticketContract.useTicket(1);
      }
      await expect(ticketContract.useTicket(1)).to.be.revertedWith(
        "No tickets left"
      );
    });

    it("Should not allow using tickets for non-existent token", async function () {
      await expect(ticketContract.useTicket(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("Should only allow owner to use tickets", async function () {
      await expect(
        ticketContract.connect(user).useTicket(1)
      ).to.be.revertedWithCustomError(
        ticketContract,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Pass Data", function () {
    beforeEach(async function () {
      await ticketContract.mint(user.address);
    });

    it("Should return correct pass data", async function () {
      const [ticketsLeft, expiry] = await ticketContract.getTicketCardData(1);
      expect(ticketsLeft).to.equal(defaultTickets);
      expect(expiry).to.be.gt(Math.floor(Date.now() / 1000));
    });

    it("Should revert when getting data for non-existent token", async function () {
      await expect(ticketContract.getTicketCardData(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });

  describe("URI", function () {
    beforeEach(async function () {
      await ticketContract.mint(user.address);
    });

    it("Should return correct token URI", async function () {
      const uri = await ticketContract.tokenURI(1);
      expect(uri).to.equal(`${baseURI}/1`);
    });

    it("Should allow owner to update baseURI", async function () {
      const newBaseURI = "https://new-api.example.com/passes/";
      await ticketContract.setBaseURI(newBaseURI);
      expect(await ticketContract.baseURI()).to.equal(newBaseURI);
      expect(await ticketContract.tokenURI(1)).to.equal(`${newBaseURI}/1`);
    });

    it("Should only allow owner to update baseURI", async function () {
      await expect(
        ticketContract.connect(user).setBaseURI("new-uri")
      ).to.be.revertedWithCustomError(
        ticketContract,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should revert when getting URI for non-existent token", async function () {
      await expect(ticketContract.tokenURI(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });
});
