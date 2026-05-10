/** @type {import("jest").Config} */
module.exports = {
    testEnvironment: "node",
    roots: [
        "<rootDir>/src",
        "<rootDir>/test-unit",
        "<rootDir>/test-integration",
    ],
    testMatch: ["**/*.test.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
                useESM: false,
            },
        ],
    },
    clearMocks: true,
    setupFiles: ["<rootDir>/jest.setup.cjs"],
};
