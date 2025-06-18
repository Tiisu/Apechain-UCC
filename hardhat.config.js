require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
 
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    apechain: {
      url: "https://curtis.rpc.caldera.xyz/http",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};