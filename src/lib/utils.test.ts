import {
  computeTokenStats,
  getTotalsByTokenType,
  getLeaderboard,
  generateURI,
  getPrimaryToken,
} from "./utils";
import { Transaction, WalletConfig, Address, TxHash, Token } from "@/types";
import { parseEther, parseUnits } from "ethers";
import { describe, test, expect } from "@jest/globals";
import mockedTransactions from "@/test/data/cht-transactions.json";

describe("getTotalsByTokenType", () => {
  // Sample wallet configs from config.json
  const wallets: WalletConfig[] = [
    {
      type: "blockchain",
      address: "0x6fDF0AaE33E313d9C98D2Aa19Bcd8EF777912CBf" as Address,
      chain: "gnosis",
      tokens: ["EURe"], // Fixed: should be string[] not Token[]
    },
    {
      type: "blockchain",
      address: "0x0000000000000000000000000000000000000000" as Address,
      chain: "celo",
      tokens: ["CHT"], // Fixed: should be string[] not Token[]
    },
  ];

  // Sample transactions
  const transactions: Transaction[] = [
    // EURe transactions
    {
      blockNumber: 1234567,
      chainId: 100, // Gnosis chain
      txHash:
        "0x1234567890123456789012345678901234567890123456789012345678901234" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0x1234567890123456789012345678901234567890" as Address,
      to: "0x6fDF0AaE33E313d9C98D2Aa19Bcd8EF777912CBf" as Address, // Wallet receiving
      value: parseEther("100").toString(), // 100 EURe incoming
      token: {
        symbol: "EURe",
        chain: "gnosis",
        address: "0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430" as Address,
        decimals: 18,
      },
    },
    {
      blockNumber: 1234568,
      chainId: 100,
      txHash:
        "0x2234567890123456789012345678901234567890123456789012345678901234" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0x6fDF0AaE33E313d9C98D2Aa19Bcd8EF777912CBf" as Address, // Wallet sending
      to: "0x9876543210987654321098765432109876543210" as Address,
      value: parseEther("30").toString(), // 30 EURe outgoing
      token: {
        symbol: "EURe",
        chain: "gnosis",
        address: "0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430" as Address,
        decimals: 18,
      },
    },
    // CHT transactions
    {
      blockNumber: 5678901,
      chainId: 42220, // Celo chain
      txHash:
        "0x3234567890123456789012345678901234567890123456789012345678901234" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0xabcdef1234567890abcdef1234567890abcdef12" as Address,
      to: "0x0000000000000000000000000000000000000000" as Address, // CHT wallet receiving
      value: parseUnits("500", 6).toString(), // 500 CHT incoming
      token: {
        symbol: "CHT",
        chain: "celo",
        address: "0x65dd32834927de9e57e72a3e2130a19f81c6371d" as Address,
        decimals: 6,
      },
    },
    {
      blockNumber: 5678902,
      chainId: 42220,
      txHash:
        "0x4234567890123456789012345678901234567890123456789012345678901234" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0x0000000000000000000000000000000000000000" as Address, // CHT wallet sending
      to: "0xfedcba0987654321fedcba0987654321fedcba09" as Address,
      value: parseUnits("200", 6).toString(), // 200 CHT outgoing
      token: {
        symbol: "CHT",
        chain: "celo",
        address: "0x65dd32834927de9e57e72a3e2130a19f81c6371d" as Address,
        decimals: 6,
      },
    },
  ];

  test("should correctly calculate token totals for multiple tokens", () => {
    const totals = getTotalsByTokenType(transactions, wallets, "USD");

    expect(totals).toEqual({
      token: {
        inbound: 500,
        outbound: 200,
        internal: 0,
      },
      fiat: {
        inbound: 100,
        outbound: 30,
        internal: 0,
      },
    });
  });

  test("should return null when no wallets are provided", () => {
    const result = getTotalsByTokenType(transactions, [], "USD");
    expect(result).toBeNull();
  });

  test("should return null when wallets is undefined", () => {
    const result = getTotalsByTokenType(
      transactions,
      undefined as unknown as WalletConfig[],
      "USD"
    );
    expect(result).toBeNull();
  });

  test("should handle transactions with unknown tokens", () => {
    const unknownTransaction: Transaction = {
      blockNumber: 9999999,
      chainId: 1,
      txHash:
        "0x5234567890123456789012345678901234567890123456789012345678901234" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0x1234567890123456789012345678901234567890" as Address,
      to: "0x9876543210987654321098765432109876543210" as Address,
      value: parseEther("1").toString(),
      token: {
        symbol: "UNKNOWN",
        chain: "ethereum",
        address: "0x1234567890123456789012345678901234567890" as Address,
        decimals: 18,
      },
    };

    const result = getTotalsByTokenType([unknownTransaction], wallets, "USD");
    expect(result).toEqual({});
  });
});

describe("computeTokenStats", () => {
  const testToken: Token = {
    symbol: "TEST",
    chain: "ethereum",
    address: "0x1234567890123456789012345678901234567890" as Address,
    decimals: 18,
  };

  const testAddress = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12" as Address;

  const transactions: Transaction[] = [
    // Inbound transaction
    {
      blockNumber: 1234567,
      chainId: 1,
      txHash:
        "0x1111111111111111111111111111111111111111111111111111111111111111" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0x9999999999999999999999999999999999999999" as Address,
      to: testAddress,
      value: parseEther("100").toString(),
      token: testToken,
    },
    // Outbound transaction
    {
      blockNumber: 1234568,
      chainId: 1,
      txHash:
        "0x2222222222222222222222222222222222222222222222222222222222222222" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: testAddress,
      to: "0x8888888888888888888888888888888888888888" as Address,
      value: parseEther("30").toString(),
      token: testToken,
    },
  ];

  test("should correctly compute token statistics", () => {
    const stats = computeTokenStats(transactions, [testAddress], [testToken]);

    const tokenKey = `${testToken.chain}:${testToken.address}`;
    expect(stats[tokenKey]).toBeDefined();
    expect(stats[tokenKey]).toEqual({
      token: testToken,
      stats: {
        all: {
          count: 2,
          value: 130, // 100 + 30 (each transaction counted once)
          net: 70, // 100 - 30
        },
        internal: {
          count: 0,
          value: 0,
        },
        inbound: {
          count: 1,
          value: 100,
        },
        outbound: {
          count: 1,
          value: 30,
        },
      },
    });
  });

  test("should ignore transactions for tokens not in the provided tokens list", () => {
    const unknownToken: Token = {
      symbol: "UNKNOWN",
      chain: "ethereum",
      address: "0x9999999999999999999999999999999999999999" as Address,
      decimals: 18,
    };

    const txWithUnknownToken: Transaction = {
      blockNumber: 1234569,
      chainId: 1,
      txHash:
        "0x3333333333333333333333333333333333333333333333333333333333333333" as TxHash,
      timestamp: Math.floor(Date.now() / 1000),
      from: "0x7777777777777777777777777777777777777777" as Address,
      to: testAddress,
      value: parseEther("50").toString(),
      token: unknownToken,
    };

    const stats = computeTokenStats(
      [...transactions, txWithUnknownToken],
      [testAddress],
      [testToken]
    );

    // Should only have stats for testToken
    expect(Object.keys(stats)).toHaveLength(1);
    expect(
      stats[`${unknownToken.chain}:${unknownToken.address}`]
    ).toBeUndefined();
    expect(stats[`${testToken.chain}:${testToken.address}`]).toBeDefined();
  });

  test("should handle empty transactions array", () => {
    const stats = computeTokenStats([], [testAddress], [testToken]);
    expect(stats).toEqual({});
  });

  test("should handle empty tokens array", () => {
    const stats = computeTokenStats(transactions, [testAddress], []);
    expect(stats).toEqual({});
  });

  test("should handle multiple inbound and outbound transactions", () => {
    const multipleTransactions: Transaction[] = [
      // First inbound
      {
        blockNumber: 1234567,
        chainId: 1,
        txHash:
          "0x1111111111111111111111111111111111111111111111111111111111111111" as TxHash,
        timestamp: Math.floor(Date.now() / 1000),
        from: "0x9999999999999999999999999999999999999999" as Address,
        to: testAddress,
        value: parseEther("50").toString(),
        token: testToken,
      },
      // Second inbound
      {
        blockNumber: 1234568,
        chainId: 1,
        txHash:
          "0x2222222222222222222222222222222222222222222222222222222222222222" as TxHash,
        timestamp: Math.floor(Date.now() / 1000),
        from: "0x8888888888888888888888888888888888888888" as Address,
        to: testAddress,
        value: parseEther("75").toString(),
        token: testToken,
      },
      // First outbound
      {
        blockNumber: 1234569,
        chainId: 1,
        txHash:
          "0x3333333333333333333333333333333333333333333333333333333333333333" as TxHash,
        timestamp: Math.floor(Date.now() / 1000),
        from: testAddress,
        to: "0x7777777777777777777777777777777777777777" as Address,
        value: parseEther("20").toString(),
        token: testToken,
      },
      // Second outbound
      {
        blockNumber: 1234570,
        chainId: 1,
        txHash:
          "0x4444444444444444444444444444444444444444444444444444444444444444" as TxHash,
        timestamp: Math.floor(Date.now() / 1000),
        from: testAddress,
        to: "0x6666666666666666666666666666666666666666" as Address,
        value: parseEther("30").toString(),
        token: testToken,
      },
      // Third outbound
      {
        blockNumber: 1234571,
        chainId: 1,
        txHash:
          "0x5555555555555555555555555555555555555555555555555555555555555555" as TxHash,
        timestamp: Math.floor(Date.now() / 1000),
        from: testAddress,
        to: "0x5555555555555555555555555555555555555555" as Address,
        value: parseEther("25").toString(),
        token: testToken,
      },
    ];

    const stats = computeTokenStats(
      multipleTransactions,
      [testAddress],
      [testToken]
    );

    const tokenKey = `${testToken.chain}:${testToken.address}`;
    expect(stats[tokenKey]).toBeDefined();
    expect(stats[tokenKey]).toEqual({
      token: testToken,
      stats: {
        all: {
          count: 5,
          value: 200, // 50+75+20+30+25 = 200 (each transaction counted once)
          net: 50, // (50+75) - (20+30+25) = 125 - 75 = 50
        },
        internal: {
          count: 0,
          value: 0,
        },
        inbound: {
          count: 2,
          value: 125, // 50 + 75
        },
        outbound: {
          count: 3,
          value: 75, // 20 + 30 + 25
        },
      },
    });
  });
});

describe("getLeaderboard with mocked transactions", () => {
  const transactions = mockedTransactions as Transaction[];

  test("should return the correct leaderboard", () => {
    const leaderboard = getLeaderboard(transactions, "USD");
    expect(leaderboard.length).toBe(25);

    // The first entry should have the highest transaction volume
    expect(leaderboard[0].stats.all.count).toBeGreaterThan(0);
    expect(leaderboard[0].stats.all.value).toBeGreaterThan(0);
    expect(leaderboard[0].transactions.length).toBeGreaterThan(0);

    // Check that it's sorted by volume (descending)
    if (leaderboard.length > 1) {
      const firstVolume =
        leaderboard[0].stats.inbound.value +
        leaderboard[0].stats.outbound.value;
      const secondVolume =
        leaderboard[1].stats.inbound.value +
        leaderboard[1].stats.outbound.value;
      expect(firstVolume).toBeGreaterThanOrEqual(secondVolume);
    }
  });
});

describe("getLeaderboard", () => {
  const transactions: Transaction[] = [
    {
      blockNumber: 31269999,
      chainId: 42220,
      txHash:
        "0xcf5e6c9a3096ca74a03d2e3f522dd87c85554801d9009a23cee40f6995fdb9ab" as TxHash,
      timestamp: 1743170757,
      from: "0xf3ad97364bccc3ea0582ede58c363888f8c4ec85" as Address,
      to: "0x08e40e1c0681d072a54fc5868752c02bb3996ffa" as Address,
      value: "3325000000000000000",
      token: {
        symbol: "CELO",
        decimals: 18,
        imageUrl:
          "https://s2.coinmarketcap.com/static/img/coins/200x200/5567.png",
        address: "native" as Address,
        chain: "celo",
      },
    },
    {
      blockNumber: 31028023,
      chainId: 42220,
      txHash:
        "0xcce5958b0a0b64a31e769c3edd3c189e02b0432c5d84998c233870ac778c8c6a" as TxHash,
      timestamp: 1742814787,
      from: "0x8922c8ac42ae84ced3a4e8d54ce7fcb3d52ebcb2" as Address,
      to: "0x08e40e1c0681d072a54fc5868752c02bb3996ffa" as Address,
      value: "15000000000000000000",
      token: {
        chain: "celo",
        address: "0x765de816845861e75a25fca122bb6898b8b1282a" as Address,
        symbol: "cUSD",
        decimals: 18,
        name: "Celo Dollar",
      },
    },
    {
      blockNumber: 22114859,
      chainId: 1,
      txHash:
        "0x4de5967cab322a13bfe40b3f756e8905b89bc202bd5b16ba649f978caf518442" as TxHash,
      timestamp: 1742796371,
      from: "0xf3e177a4034cf6e57ccbe80108cae6f3729c6649" as Address,
      to: "0x371ca2c8f1d02864c7306e5e5ed5dc6edf2dd19c" as Address,
      value: "10000000000000000000",
      token: {
        chain: "ethereum",
        address: "0x6b175474e89094c44da98b954eedeac495271d0f" as Address,
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
      },
    },
    {
      blockNumber: 22081319,
      chainId: 1,
      txHash:
        "0xe0165fc1f9563e124c16692102e50c7910d090b128ba01c421351ca5ff057dff" as TxHash,
      timestamp: 1742392175,
      from: "0xb6647e02ae6dd74137cb80b1c24333852e4af890" as Address,
      to: "0x371ca2c8f1d02864c7306e5e5ed5dc6edf2dd19c" as Address,
      value: "5000000",
      token: {
        chain: "ethereum",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as Address,
        symbol: "USDC",
        decimals: 6,
        name: "USDC",
      },
    },
  ];

  test("should return the token for the primary currency", () => {
    const token = getPrimaryToken(42220, "USD");
    expect(token).toBeDefined();
    expect(token?.symbol).toBe("USDC");
  });

  test("should correctly compute leaderboard with multiple tokens and addresses", () => {
    const leaderboard = getLeaderboard(transactions, "USD");

    // Should have entries for each unique address (both senders and receivers)
    expect(leaderboard.length).toBeGreaterThan(0);

    // Check that entries are created
    const addressesInLeaderboard = leaderboard.map((entry) =>
      entry.uri.split(":").pop()?.toLowerCase()
    );

    // Should include the recipient addresses
    expect(addressesInLeaderboard).toContain(
      "0x08e40e1c0681d072a54fc5868752c02bb3996ffa"
    );
    expect(addressesInLeaderboard).toContain(
      "0x371ca2c8f1d02864c7306e5e5ed5dc6edf2dd19c"
    );

    // Check that stats are calculated
    leaderboard.forEach((entry) => {
      expect(entry.stats.all.count).toBeGreaterThan(0);
      expect(entry.transactions.length).toBeGreaterThan(0);
    });
  });
});
