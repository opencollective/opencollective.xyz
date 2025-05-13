module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "@/chains.json": "<rootDir>/chains.json",
    "@/config.json": "<rootDir>/config.json",
    "@/tokens.json": "<rootDir>/tokens.json",
    "@/relays.json": "<rootDir>/relays.json",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
