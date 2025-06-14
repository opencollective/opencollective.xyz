/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Transform configuration (replaces the deprecated globals config)
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        // Use type checking only when needed
        // Use swc for faster compilation (if available)
        useESM: false,
      },
    ],
  },

  // Module name mapping (same as your current config)
  moduleNameMapper: {
    "@/data/(.*)": "<rootDir>/data/$1",
    "@/config.json": "<rootDir>/config.json",
    "@/tokens.json": "<rootDir>/tokens.json",
    "@/relays.json": "<rootDir>/relays.json",
    "@/test/(.*)": "<rootDir>/test/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Test file patterns
  testMatch: ["**/__tests__/**/*.(ts|tsx|js)", "**/*.(test|spec).(ts|tsx|js)"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/test/contracts/", // Ignore Hardhat test files
  ],
  // Coverage settings
  collectCoverageFrom: ["src/**/*.(ts|tsx)", "!src/**/*.d.ts"],

  // Transform ignore patterns
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
};
