require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    apechain: {
      url: process.env.APECHAIN_RPC_URL || "https://apechain.calderachain.xyz/http",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
      chainId: 33139,
      gasPrice: 20000000000, // 20 gwei
    },
    apechain_testnet: {
      url: process.env.APECHAIN_TESTNET_RPC_URL || "https://curtis.apechain.calderachain.xyz/http",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
      chainId: 33111,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      apechain: process.env.APECHAIN_API_KEY || "your-api-key",
      apechain_testnet: process.env.APECHAIN_TESTNET_API_KEY || "your-api-key",
    },
    customChains: [
      {
        network: "apechain",
        chainId: 33139,
        urls: {
          apiURL: "https://api.apechain.calderachain.xyz/api",
          browserURL: "https://apechain.calderachain.xyz",
        },
      },
      {
        network: "apechain_testnet",
        chainId: 33111,
        urls: {
          apiURL: "https://api.curtis.apechain.calderachain.xyz/api",
          browserURL: "https://curtis.apechain.calderachain.xyz",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
