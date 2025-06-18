require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000, // Increased for better gas optimization on APE Chain
      },
      viaIR: true, // Enables the new IR-based code generator for better optimization
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // APE Chain Mainnet
    apechain: {
      url: "https://apechain.calderachain.xyz/http",
      chainId: 33139,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto", // Let the network determine optimal gas price
      gas: "auto", // Automatic gas limit estimation
      timeout: 60000, // 60 seconds timeout for transactions
    },
    // APE Chain Testnet (Curtis)
    curtis: {
      url: "https://curtis.rpc.caldera.xyz/http",
      chainId: 33111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto", // Let the network determine optimal gas price
      gas: "auto", // Automatic gas limit estimation
      timeout: 60000, // 60 seconds timeout for transactions
    },
  },
  // Contract verification configuration
  etherscan: {
    apiKey: {
      apechain: process.env.ETHERSCAN_API_KEY || "dummy-key", // APE Chain doesn't require API key
      curtis: process.env.ETHERSCAN_API_KEY || "dummy-key", // Curtis testnet doesn't require API key
    },
    customChains: [
      {
        network: "apechain",
        chainId: 33139,
        urls: {
          apiURL: "https://apechain.calderaexplorer.xyz/api",
          browserURL: "https://apechain.calderaexplorer.xyz/",
        },
      },
      {
        network: "curtis",
        chainId: 33111,
        urls: {
          apiURL: "https://curtis.explorer.caldera.xyz/api",
          browserURL: "https://curtis.explorer.caldera.xyz/",
        },
      },
    ],
  },
  // Sourcify configuration (alternative verification method)
  sourcify: {
    enabled: false, // Disable sourcify for APE Chain as it uses custom explorers
    apiUrl: "https://sourcify.dev/server",
    browserUrl: "https://repo.sourcify.dev",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 60000 // Increased timeout for APE Chain network latency
  },
  // Gas reporter configuration for optimization tracking
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20, // APE Chain typical gas price in gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  }
};