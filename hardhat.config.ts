import "@nomiclabs/hardhat-waffle";
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require('dotenv').config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.8.4",
  paths: {
    artifacts: "./app/artifacts",
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    fuji: {
      url: process.env.FUJI_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 50,
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    enabled: true
  }
};
