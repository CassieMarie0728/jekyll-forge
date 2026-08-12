module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
};
